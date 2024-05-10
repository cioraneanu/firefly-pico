<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="addButtonText" @click="onNew" />
      </template>
    </app-top-toolbar>

    <van-form ref="form" class="" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset>
        <app-field
          v-model="name"
          name="Name"
          label="Name"
          rows="1"
          autosize
          left-icon="notes-o"
          placeholder="Description"
          :rules="[{ required: true, message: 'Name is required' }]"
        />

        <icon-select v-model="icon" />
      </van-cell-group>

      <div style="margin: 16px">
        <app-button-form-save />

        <app-button-form-delete v-if="itemId" class="mt-10" @click="onDelete" />
      </div>
    </van-form>
  </div>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useDataStore } from '~/stores/dataStore'
import _ from 'lodash'
import { useAppStore } from '~/stores/appStore'
import { ref } from 'vue'
import { useForm } from '~/composables/useForm'
import { generateChildren } from '~/utils/VueUtils'
import Category from '~/models/Category'
import { useToolbar } from '~/composables/useToolbar'
import CategoryTransformer from '~/transformers/CategoryTransformer'

const dataStore = useDataStore()
const appStore = useAppStore()
const route = useRoute()

const form = ref(null)

const resetFields = () => {
  name.value = ''
}

const fetchItem = () => {
  const dataStore = useDataStore()
  item.value = dataStore.categoryDictionary[itemId.value]
}

const onEvent = (event, payload) => {
  if (event === 'onPostSave') {
    let newItem = _.get(payload, 'data.data')
    newItem = CategoryTransformer.transformFromApi(newItem)
    dataStore.categoryList = [newItem, ...dataStore.categoryList.filter((item) => item.id !== itemId.value)]
  }
  if (event === 'onPostDelete') {
    dataStore.categoryList = dataStore.categoryList.filter((item) => item.id !== itemId.value)
  }
}

const {
  itemId,
  item,
  isEmpty,
  title,
  addButtonText,
  isLoading,
  onClickBack,
  saveItem,
  onDelete,
  onNew,
  onValidationError,
} = useForm({
  form: form,
  titleAdd: 'Add category',
  titleEdit: 'Edit category',
  routeList: RouteConstants.ROUTE_CATEGORY_LIST,
  routeForm: RouteConstants.ROUTE_CATEGORY_ID,
  model: new Category(),
  resetFields: resetFields,
  fetchItem: fetchItem,
  onEvent: onEvent,
})

const { name, type, role, icon } = generateChildren(item, [
  { computed: 'name', parentKey: 'attributes.name' },
  { computed: 'icon', parentKey: `attributes.icon` },
])

watch(name, (newValue) => {
  if (!appStore.lowerCaseCategoryName) {
    return
  }
  name.value = newValue.toLowerCase()
})

const toolbar = useToolbar()
toolbar.init({
  title: title,
  leftText: 'List',
  backRoute: RouteConstants.ROUTE_CATEGORY_LIST,
})
</script>
