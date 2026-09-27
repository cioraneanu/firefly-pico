import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parse } from '@vue/compiler-sfc'
import { computed, reactive } from 'vue'

const source = await readFile(new URL('../pages/todo-inbox.vue', import.meta.url), 'utf8')
const { descriptor } = parse(source)
const expression = descriptor.scriptSetup.content.match(/const editorPopupStyle = computed\(([\s\S]*?)\n\}\)\)/)[1] + '\n})'

for (const desktop of [false, true]) {
  test(`${desktop ? 'desktop' : 'mobile'} editor bounds the form scroll area while keeping its controls outside it`, () => {
    const appStore = reactive({ isDesktopLayout: desktop })
    const style = new Function('computed', 'appStore', `return computed(${expression})`)(computed, appStore).value
    assert.equal(style.display, 'flex')
    assert.equal(style.flexDirection, 'column')
    assert.equal(style.overflow, 'hidden')
    assert.ok(style.height)
    assert.ok(style.maxHeight)
  })
}

test('overlay dismissal goes through the same guarded close as the Close button', () => {
  const popup = descriptor.template.content.match(/<app-popup[^>]+:show="editorOpen"[^>]*>/)[0]
  assert.match(popup, /:close-on-click-overlay="false"/)
  assert.match(popup, /@click-overlay="closeEditor"/)
  assert.match(popup, /@update:show="onEditorVisibilityChange"/)
})
