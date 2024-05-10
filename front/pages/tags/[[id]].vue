<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="addButtonText" @click="onNew" />
      </template>
    </app-top-toolbar>

    <!--    <van-pull-refresh-->
    <!--        v-model="dataStore.isLoadingTags"-->
    <!--        @refresh="onRefresh">-->

    <van-form ref="form" @submit="saveItem" @failed="onValidationError" class="">
      <van-cell-group inset>
        <app-field
          v-model="tag"
          name="Name"
          label="Name"
          rows="1"
          autosize
          left-icon="notes-o"
          placeholder="Description (lowercase)"
          :rules="[{ required: true, message: 'Name is required' }]"
          required
        />

        <tag-select label="Parent tag" v-model="parentTag" :isMultiSelect="false" />

        <icon-select v-model="icon" />

        <app-boolean label="Mark as to-do" v-model="isTodo">
          <template #label>
            <div class="flex-center-vertical gap-1">
              <div class="flex-1">Mark as to-do</div>
              <app-tutorial v-bind="TUTORIAL_CONSTANTS.todoTag" />
            </div>
          </template>
        </app-boolean>

        <!--        <app-icon-select-new-->
        <!--            v-model="icon"-->
        <!--        />-->

        <!--        <icon-select-->
        <!--            v-model="icon"-->
        <!--        />-->

        <!--        <app-field-->
        <!--            v-model="icon"-->
        <!--            name="Icon"-->
        <!--            label="Icon"-->
        <!--            left-icon="notes-o"-->
        <!--            placeholder="Icon"-->
        <!--        />-->
      </van-cell-group>

      <div style="margin: 16px">
        <app-button-form-save />

        <app-button-form-delete class="mt-10" v-if="itemId" @click="onDelete" />
      </div>
    </van-form>

    <!--    </van-pull-refresh>-->
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useDataStore } from '~/stores/dataStore'
import _, { cloneDeep, get, set } from 'lodash'
import { useAppStore } from '~/stores/appStore'
import { ref } from 'vue'
import { useForm } from '~/composables/useForm'
import { generateChildren } from '~/utils/VueUtils'
import Tag from '~/models/Tag'
import { useToolbar } from '~/composables/useToolbar'
import TagTransformer from '~/transformers/TagTransformer'
import TagSelect from '~/components/select/tag-select.vue'
import { TUTORIAL_CONSTANTS } from '~/constants/TutorialConstants.js'

let dataStore = useDataStore()
let appStore = useAppStore()
const route = useRoute()

const form = ref(null)

const fetchItem = async () => {
  let tag = cloneDeep(dataStore.tagDictionaryById[itemId.value])

  let parentTagId = get(tag, 'attributes.parent_id')
  if (parentTagId) {
    tag.attributes.parentTag = dataStore.tagDictionaryById[parentTagId]
  }
  item.value = tag
}

const onEvent = (event, payload) => {
  if (event === 'onPostSave') {
    let newItem = _.get(payload, 'data.data')
    newItem = TagTransformer.transformFromApi(newItem)

    let isTodo = get(newItem, 'attributes.is_todo')
    const oldTagsList = dataStore.tagList.map((item) => (isTodo && set(item, 'attributes.is_todo', false)) || item).filter((item) => item.id !== itemId.value)
    dataStore.tagList = [newItem, ...oldTagsList]
  }
  if (event === 'onPostDelete') {
    dataStore.tagList = dataStore.tagList.filter((item) => parseInt(item.id) !== parseInt(itemId.value))
  }
}

const resetFields = () => {
  tag.value = ''
}

let { itemId, item, isEmpty, title, addButtonText, isLoading, onClickBack, saveItem, onDelete, onNew, onValidationError } = useForm({
  form: form,
  titleAdd: 'Add tag',
  titleEdit: 'Edit tag',
  routeList: RouteConstants.ROUTE_TAG_LIST,
  routeForm: RouteConstants.ROUTE_TAG_ID,
  model: new Tag(),
  resetFields: resetFields,
  fetchItem: fetchItem,
  onEvent: onEvent,
})

const { tag, parentTag, icon, isTodo } = generateChildren(item, [
  { computed: 'tag', parentKey: 'attributes.tag' },
  { computed: 'parentTag', parentKey: 'attributes.parentTag' },
  { computed: 'icon', parentKey: 'attributes.icon' },
  { computed: 'isTodo', parentKey: 'attributes.is_todo' },
])

const toolbar = useToolbar()
toolbar.init({
  title: title,
  leftText: 'List',
  backRoute: RouteConstants.ROUTE_TAG_LIST,
})

const onRefresh = () => {
  dataStore.fetchTags()
}

watch(tag, (newValue) => {
  if (!appStore.lowerCaseTagName) {
    return
  }
  tag.value = newValue.toLowerCase()
})
</script>
