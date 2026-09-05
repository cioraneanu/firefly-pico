import { describe, expect, it } from 'vitest'
import { buildDimensionQuery, buildAnalyticsFilterPlan, expandFanOutCombos, fanOutComboCount, exceedsFanOutCap, splitMatchesAnalyticsFilters, analyticsFilterModes } from '~/utils/AnalyticsFilterUtils'

const category = (id, name) => ({ id, attributes: { name } })
const budget = (id, name) => ({ id, attributes: { name } })
const tag = (id, name) => ({ id, attributes: { tag: name } })
const account = (id, name) => ({ id, attributes: { name } })

describe('buildDimensionQuery', () => {
  it('returns nothing for an empty selection', () => {
    expect(buildDimensionQuery('category', [], analyticsFilterModes.include)).toEqual({ fragments: [], fanOutValues: null })
    expect(buildDimensionQuery('category', null, analyticsFilterModes.include)).toEqual({ fragments: [], fanOutValues: null })
  })

  it('exclude mode repeats one negation clause per item, regardless of count (proven-safe, mirrors getExcludedTransactionFilters)', () => {
    const { fragments, fanOutValues } = buildDimensionQuery('category', [category(1, 'Groceries'), category(2, 'Rent')], analyticsFilterModes.exclude)
    expect(fragments).toEqual(['-category_is:"Groceries"', '-category_is:"Rent"'])
    expect(fanOutValues).toBeNull()
  })

  it('include mode with a single name-based item is a single safe fragment', () => {
    const { fragments, fanOutValues } = buildDimensionQuery('tag', [tag(1, 'Vacation')], analyticsFilterModes.include)
    expect(fragments).toEqual(['tag_is:"Vacation"'])
    expect(fanOutValues).toBeNull()
  })

  it('include mode with 2+ name-based items has no safe single fragment — fans out one value per item instead', () => {
    const { fragments, fanOutValues } = buildDimensionQuery('budget', [budget(1, 'Groceries'), budget(2, 'Rent')], analyticsFilterModes.include)
    expect(fragments).toEqual([])
    expect(fanOutValues).toEqual(['budget_is:"Groceries"', 'budget_is:"Rent"'])
  })

  it('account is id-based, so include mode uses the proven comma-list even with 2+ items — no fan-out', () => {
    const { fragments, fanOutValues } = buildDimensionQuery('account', [account(5, 'Checking'), account(6, 'Savings')], analyticsFilterModes.include)
    expect(fragments).toEqual(['account_id:"5,6"'])
    expect(fanOutValues).toBeNull()
  })

  it('account exclude mode still repeats one negation clause per id', () => {
    const { fragments } = buildDimensionQuery('account', [account(5, 'Checking')], analyticsFilterModes.exclude)
    expect(fragments).toEqual(['-account_id:"5"'])
  })
})

describe('buildAnalyticsFilterPlan', () => {
  it('combines simple fragments across dimensions and collects fan-out groups separately', () => {
    const { simpleFragments, fanOutGroups } = buildAnalyticsFilterPlan({
      category: { selected: [category(1, 'A'), category(2, 'B')], mode: analyticsFilterModes.include },
      tag: { selected: [tag(3, 'X')], mode: analyticsFilterModes.exclude },
      budget: { selected: [], mode: analyticsFilterModes.include },
      account: { selected: [account(5, 'Checking')], mode: analyticsFilterModes.include },
    })
    expect(simpleFragments).toEqual(['-tag_is:"X"', 'account_id:"5"'])
    expect(fanOutGroups).toEqual([{ dimension: 'category', values: ['category_is:"A"', 'category_is:"B"'] }])
  })

  it('is a no-op for an empty filter state', () => {
    expect(buildAnalyticsFilterPlan({})).toEqual({ simpleFragments: [], fanOutGroups: [] })
  })
})

describe('expandFanOutCombos / fanOutComboCount', () => {
  it('returns a single empty combo when there is nothing to fan out', () => {
    expect(expandFanOutCombos([])).toEqual([[]])
    expect(fanOutComboCount([])).toBe(1)
  })

  it('takes the Cartesian product across multiple fan-out dimensions', () => {
    const groups = [
      { dimension: 'category', values: ['category_is:"A"', 'category_is:"B"'] },
      { dimension: 'tag', values: ['tag_is:"X"', 'tag_is:"Y"', 'tag_is:"Z"'] },
    ]
    const combos = expandFanOutCombos(groups)
    expect(combos).toHaveLength(6)
    expect(combos).toContainEqual(['category_is:"A"', 'tag_is:"X"'])
    expect(combos).toContainEqual(['category_is:"B"', 'tag_is:"Z"'])
    expect(fanOutComboCount(groups)).toBe(6)
  })
})

describe('exceedsFanOutCap', () => {
  it('flags when the combo count exceeds the cap', () => {
    const groups = [
      { dimension: 'category', values: ['a', 'b', 'c', 'd'] },
      { dimension: 'tag', values: ['x', 'y', 'z', 'w'] },
    ]
    expect(exceedsFanOutCap(groups, 12)).toBe(true) // 16 combos > 12
    expect(exceedsFanOutCap(groups, 20)).toBe(false)
  })
})

describe('splitMatchesAnalyticsFilters', () => {
  // Firefly's {field}_is query operators match at the GROUP level — once any one split in a
  // group matches, the whole group (every split) comes back over the wire. These tests cover the
  // client-side re-check that keeps a non-matching sibling split from leaking into a by* map.
  const split = ({ categoryId = null, budgetId = null, tags = [], sourceId = null, destinationId = null } = {}) => ({
    category_id: categoryId,
    budget_id: budgetId,
    tags,
    source_id: sourceId,
    destination_id: destinationId,
  })

  it('passes every split when no filter is active', () => {
    expect(splitMatchesAnalyticsFilters(split(), {})).toBe(true)
    expect(splitMatchesAnalyticsFilters(split({ budgetId: 'b-1' }), null)).toBe(true)
  })

  it('include mode: rejects a sibling split under a DIFFERENT budget than the one selected', () => {
    const filterState = { budget: { selected: [budget('b-1', 'Groceries')], mode: analyticsFilterModes.include } }
    expect(splitMatchesAnalyticsFilters(split({ budgetId: 'b-1' }), filterState)).toBe(true)
    expect(splitMatchesAnalyticsFilters(split({ budgetId: 'b-2' }), filterState)).toBe(false)
    expect(splitMatchesAnalyticsFilters(split({ budgetId: null }), filterState)).toBe(false)
  })

  it('include mode with 2+ selected values is an OR across them (matches the fan-out combos)', () => {
    const filterState = { category: { selected: [category('c-1', 'A'), category('c-2', 'B')], mode: analyticsFilterModes.include } }
    expect(splitMatchesAnalyticsFilters(split({ categoryId: 'c-1' }), filterState)).toBe(true)
    expect(splitMatchesAnalyticsFilters(split({ categoryId: 'c-2' }), filterState)).toBe(true)
    expect(splitMatchesAnalyticsFilters(split({ categoryId: 'c-3' }), filterState)).toBe(false)
  })

  it('exclude mode rejects a split matching an excluded value, passes everything else', () => {
    const filterState = { tag: { selected: [tag('t-1', 'Vacation')], mode: analyticsFilterModes.exclude } }
    expect(splitMatchesAnalyticsFilters(split({ tags: [{ id: 't-1' }] }), filterState)).toBe(false)
    expect(splitMatchesAnalyticsFilters(split({ tags: [{ id: 't-2' }] }), filterState)).toBe(true)
    expect(splitMatchesAnalyticsFilters(split({ tags: [] }), filterState)).toBe(true)
  })

  it('account matches on either source or destination', () => {
    const filterState = { account: { selected: [account('a-1', 'Checking')], mode: analyticsFilterModes.include } }
    expect(splitMatchesAnalyticsFilters(split({ sourceId: 'a-1', destinationId: 'a-9' }), filterState)).toBe(true)
    expect(splitMatchesAnalyticsFilters(split({ sourceId: 'a-9', destinationId: 'a-1' }), filterState)).toBe(true)
    expect(splitMatchesAnalyticsFilters(split({ sourceId: 'a-8', destinationId: 'a-9' }), filterState)).toBe(false)
  })

  it('ANDs across multiple active dimensions', () => {
    const filterState = {
      budget: { selected: [budget('b-1', 'Groceries')], mode: analyticsFilterModes.include },
      category: { selected: [category('c-1', 'Food')], mode: analyticsFilterModes.include },
    }
    expect(splitMatchesAnalyticsFilters(split({ budgetId: 'b-1', categoryId: 'c-1' }), filterState)).toBe(true)
    expect(splitMatchesAnalyticsFilters(split({ budgetId: 'b-1', categoryId: 'c-2' }), filterState)).toBe(false)
  })
})
