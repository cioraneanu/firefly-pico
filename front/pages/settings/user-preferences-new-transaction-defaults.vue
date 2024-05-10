<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset>
        <account-select v-model="defaultAccountSource" label="Default source account" />

        <account-select v-model="defaultAccountDestination" label="Default destination account" />

        <category-select v-model="defaultCategory" label="Default category" />

        <tag-select v-model="defaultTags" label="Default tags (only preselected)" />

        <tag-select v-model="autoAddedTags" label="Auto tags (appended after creation)" />
      </van-cell-group>

      <app-button-form-save />
    </van-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAppStore } from '~/stores/appStore'
import { useDataStore } from '~/stores/dataStore'
import UIUtils from '~/utils/UIUtils'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'

const appStore = useAppStore()
const dataStore = useDataStore()

const defaultAccountSource = ref(null)
const defaultAccountDestination = ref(null)
const defaultCategory = ref(null)
const defaultTags = ref([])
const autoAddedTags = ref([])

onMounted(() => {
  init()
})

const onSave = async () => {
  appStore.defaultAccountSource = defaultAccountSource.value
  appStore.defaultAccountDestination = defaultAccountDestination.value
  appStore.defaultCategory = defaultCategory.value
  appStore.defaultTags = defaultTags.value
  appStore.autoAddedTags = autoAddedTags.value

  UIUtils.showToastSuccess('User preferences saved')
  init()
}

const init = () => {
  defaultAccountSource.value = appStore.defaultAccountSource
  defaultAccountDestination.value = appStore.defaultAccountDestination
  defaultCategory.value = appStore.defaultCategory
  defaultTags.value = appStore.defaultTags
  autoAddedTags.value = appStore.autoAddedTags
}

const toolbar = useToolbar()
toolbar.init({
  title: 'New transaction defaults',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})
</script>
