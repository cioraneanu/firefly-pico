import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parse } from '@vue/compiler-sfc'
import { baseParse } from '@vue/compiler-dom'
import { computed, reactive } from 'vue'
import RouteConstants from '../constants/RouteConstants.js'
import TablerIconConstants from '../constants/TablerIconConstants.js'

const source = await readFile(new URL('../pages/extras.vue', import.meta.url), 'utf8')
const { descriptor } = parse(source)
const root = baseParse(descriptor.template.content)
const groups = root.children.find((node) => node.tag === 'div').children.filter((node) => node.tag === 'van-cell-group')
const extra = groups.find((group) => group.children.some((node) => node.tag === 'div' && node.children.some((child) => child.content?.content?.includes("$t('extra')"))))
const binding = (node, name) => node.props.find((prop) => prop.arg?.content === name)?.exp?.content
const link = extra.children.find((node) => node.tag === 'app-field-link' && binding(node, 'label') === "$t('todo_inbox.title')")

test('Extras Extra section links to the TODO Inbox with its translated title and check icon', () => {
  assert.ok(link, 'TODO Inbox link is missing from the Extra section')
  assert.equal(binding(link, 'icon'), 'TablerIconConstants.booleanCheckOn')
  assert.equal(binding(link, 'click'), 'navigateTo(RouteConstants.ROUTE_TODO_INBOX)')
})

test('Inbox entry follows the Tags feature setting without requiring a configured marker', () => {
  assert.ok(link, 'TODO Inbox link is missing')
  assert.equal(link.props.find((prop) => prop.name === 'if')?.exp?.content, 'profileStore.tagsEnabled')
})

const sidebarSource = await readFile(new URL('../components/ui-kit/theme/app-left-sidebar/app-left-sidebar.vue', import.meta.url), 'utf8')
const sidebarScript = parse(sidebarSource).descriptor.scriptSetup.content
const sectionsDeclaration = sidebarScript.slice(sidebarScript.indexOf('const sidebarSections ='), sidebarScript.indexOf('const settingsPages ='))
const getSections = new Function('computed', 'profileStore', 't', 'RouteConstants', 'TablerIconConstants', `${sectionsDeclaration}\nreturn sidebarSections`)

test('desktop Extra section exposes the same Inbox route, title and icon as mobile', () => {
  const sections = getSections(computed, { tagsEnabled: true }, (key) => key, RouteConstants, TablerIconConstants)
  const inbox = sections.value.find((section) => section.key === 'extra').pages.find((page) => page.route === RouteConstants.ROUTE_TODO_INBOX)
  assert.ok(inbox, 'TODO Inbox link is missing from desktop Extra')
  assert.equal(inbox.label, 'todo_inbox.title')
  assert.equal(inbox.icon, TablerIconConstants.booleanCheckOn)
})

test('desktop Inbox visibility reacts to the Tags feature setting', () => {
  const profile = reactive({ tagsEnabled: false })
  const sections = getSections(computed, profile, (key) => key, RouteConstants, TablerIconConstants)
  const inboxVisible = () => sections.value.find((section) => section.key === 'extra').pages.some((page) => page.route === RouteConstants.ROUTE_TODO_INBOX)
  assert.equal(inboxVisible(), false)
  profile.tagsEnabled = true
  assert.equal(inboxVisible(), true)
  profile.tagsEnabled = false
  assert.equal(inboxVisible(), false)
})
