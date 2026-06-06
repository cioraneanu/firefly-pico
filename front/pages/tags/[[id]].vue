<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <app-card-info v-if="itemId">
      <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
    </app-card-info>

    <van-form ref="form" :name="formName" class="" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset>
        <app-field v-model="tag" name="name" :label="$t('name')" rows="1" autosize :icon="TablerIconConstants.fieldText2" :rules="[rule.required()]" required />
        <tag-select v-model="parentTag" :label="$t('tag_page.parent_tag')" :is-multi-select="false" />
        <app-field v-model="description" name="description" :label="$t('description')" autosize :icon="TablerIconConstants.fieldText1" />
        <app-date v-model="date" :label="$t('tag_page.end_date')" :icon="TablerIconConstants.settingsUserPreferencesDate" />
        <icon-select v-model="icon" />

        <app-boolean v-model="isTodo">
          <template #label>
            <div class="flex-center-vertical gap-1">
              <div class="flex-1">{{ $t('tag_page.mark_as_todo') }}</div>
              <app-tutorial v-bind="TUTORIAL_CONSTANTS.todoTag" />
            </div>
          </template>
        </app-boolean>
      </van-cell-group>

      <div style="margin: 16px">
        <app-button-form-save />

        <app-button-form-delete v-if="itemId" class="mt-10" @click="onDelete" />
      </div>
    </van-form>

    <!--    </van-pull-refresh>-->
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useTagStore } from '~/stores/tagStore'
import _, { cloneDeep, get, set } from 'lodash-es'
import { useProfileStore } from '~/stores/profileStore'
import { ref } from 'vue'
import { useForm } from '~/composables/useForm'
import { generateChildren } from '~/utils/VueUtils'
import Tag from '~/models/Tag'
import { useToolbar } from '~/composables/useToolbar'
import TagTransformer from '~/transformers/TagTransformer'
import TagSelect from '~/components/select/tag-select.vue'
import { TUTORIAL_CONSTANTS } from '~/constants/TutorialConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'
import { rule } from '~/utils/ValidationUtils.js'

const tagStore = useTagStore()
const profileStore = useProfileStore()
const route = useRoute()

const form = ref(null)

const fetchItem = async () => {
  const tag = cloneDeep(tagStore.tagDictionaryById[useRoute().params.id])

  const parentTagId = get(tag, 'attributes.parent_id')
  if (parentTagId) {
    tag.attributes.parentTag = tagStore.tagDictionaryById[parentTagId]
  }
  item.value = tag
}

const onEvent = (event, payload) => {
  if (event === 'onPostSave') {
    let newItem = _.get(payload, 'data.data')
    newItem = TagTransformer.transformFromApi(newItem)

    const isTodo = get(newItem, 'attributes.is_todo')
    const oldTagsList = tagStore.tagList.map((item) => (isTodo && set(item, 'attributes.is_todo', false)) || item).filter((item) => item.id !== itemId.value)
    tagStore.tagList = [newItem, ...oldTagsList]
  }
  if (event === 'onPostDelete') {
    tagStore.tagList = tagStore.tagList.filter((item) => parseInt(item.id) !== parseInt(itemId.value))
  }
}

const resetFields = () => {
  tag.value = ''
}

const { itemId, item, saveItem, onDelete, onNew, onValidationError, formName } = useForm({
  form: form,
  routeList: RouteConstants.ROUTE_TAG_LIST,
  routeForm: RouteConstants.ROUTE_TAG_ID,
  model: new Tag(),
  resetFields: resetFields,
  fetchItem: fetchItem,
  onEvent: onEvent,
})

const { tag, description, date, parentTag, icon, isTodo } = generateChildren(item, [
  { computed: 'tag', parentKey: 'attributes.tag' },
  { computed: 'description', parentKey: 'attributes.description' },
  { computed: 'date', parentKey: 'attributes.date' },
  { computed: 'parentTag', parentKey: 'attributes.parentTag' },
  { computed: 'icon', parentKey: 'attributes.icon' },
  { computed: 'isTodo', parentKey: 'attributes.is_todo' },
])

const toolbar = useToolbar()
const { t } = useI18n()

toolbar.init({
  title: itemId.value ? t('tag_page.title_edit') : t('tag_page.title_add'),
  backRoute: RouteConstants.ROUTE_TAG_LIST,
})

const onNavigateToTransactionsList = async () => {
  const filters = TransactionFilterUtils.filters.tag.toUrl(item.value)
  await navigateTo(`${RouteConstants.ROUTE_TRANSACTION_LIST}?${filters}`)
}

watch(tag, (newValue) => {
  if (profileStore.lowerCaseTagName) {
    newValue = newValue.toLowerCase()
  }
  if (profileStore.stripAccents) {
    newValue = LanguageUtils.removeAccents(newValue)
  }
  tag.value = newValue
})
</script>
