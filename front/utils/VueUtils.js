import * as _ from 'lodash'
import { isEqual } from 'lodash'
import { computed } from 'vue'

export function generateChildren(localVariable, newComputedSubKeys = []) {
  const subItems = newComputedSubKeys.reduce((result, key) => {
    if (!key) {
      return result
    }

    let parentKey = key
    let computedKey = key
    if (typeof key === 'object') {
      computedKey = key['computed']
      parentKey = key['parentKey'] ?? computedKey
    }

    result[computedKey] = computed({
      get() {
        return _.get(localVariable.value, parentKey)
      },
      set(value) {
        _.set(localVariable.value, parentKey, value)
      },
    })

    return result
  }, {})

  return subItems
}

export function generateChildrenWithClone(localVariable, newComputedSubKeys = []) {
  let refs = {}
  for (let key of newComputedSubKeys) {
    let computedName = key['computed']
    let parentPath = key['parentKey'] ?? computedName
    let localRef = ref(null)
    refs[computedName] = localRef

    watch(
      () => localRef.value,
      async (newValue, oldValue) => {
        // Escape the null vs undefined scenario
        if (!newValue && !oldValue) {
          return
        }
        if (_.isEqual(newValue, oldValue)) {
          return
        }

        let newLocalVariable = _.cloneDeep(localVariable.value)
        _.set(newLocalVariable, parentPath, newValue)
        localVariable.value = newLocalVariable
      },
      { immediate: true },
    )

    // parentKey = _.head(Object.keys(key))
    // computedKey = key[parentKey]
  }

  watch(
    () => localVariable.value,
    async (newValue, oldValue) => {
      if (!newValue && !oldValue) {
        return
      }
      if (_.isEqual(newValue, oldValue)) {
        return
      }

      // let newLocalVariable = _.cloneDeep(localVariable.value)
      // _.set(newLocalVariable, parentPath, newValue)

      for (let key of newComputedSubKeys) {
        let computedName = key['computed']
        let parentPath = key['parentKey'] ?? computedName
        refs[computedName].value = _.get(newValue, parentPath)
      }
    },
    { immediate: true },
  )
  return refs
}

export function bindOneWay(source, destination, { immediate = true, deep = true } = {}) {
  watch(
    source,
    (newValue) => {
      destination.value = newValue
    },
    { immediate, deep },
  )
}

export function bindTwoWay(
  source,
  destination,
  { immediate = true, deep = true, transformSource = null, transformDestination = null } = {},
) {
  watch(
    source,
    (newValue) => {
      let result = transformSource ? transformSource(newValue) : newValue
      if (isEqual(result, destination.value)) {
        return
      }
      destination.value = result
    },
    { immediate: true, deep: true },
  )

  watch(
    destination,
    (newValue) => {
      let result = transformDestination ? transformDestination(newValue) : newValue
      if (isEqual(result, source.value)) {
        return
      }
      source.value = result
    },
    { immediate, deep },
  )
}

export async function sleep(millis) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), millis)
  })
}

export const moveInputCursorToEnd = (inputRef, inputValue) => {
  const cursorPosition = inputValue.value.length + 1
  // await nextTick()
  inputRef.value.setSelectionRange(cursorPosition, cursorPosition)
}
