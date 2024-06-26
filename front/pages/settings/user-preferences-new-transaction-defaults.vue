<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
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
import { useProfileStore } from '~/stores/profileStore'
import { useDataStore } from '~/stores/dataStore'
import UIUtils from '~/utils/UIUtils'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'

const profileStore = useProfileStore()
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
  profileStore.defaultAccountSource = defaultAccountSource.value
  profileStore.defaultAccountDestination = defaultAccountDestination.value
  profileStore.defaultCategory = defaultCategory.value
  profileStore.defaultTags = defaultTags.value
  profileStore.autoAddedTags = autoAddedTags.value

  await profileStore.writeProfile()

  UIUtils.showToastSuccess('User preferences saved')
  init()
}

const init = () => {
  defaultAccountSource.value = profileStore.defaultAccountSource
  defaultAccountDestination.value = profileStore.defaultAccountDestination
  defaultCategory.value = profileStore.defaultCategory
  defaultTags.value = profileStore.defaultTags
  autoAddedTags.value = profileStore.autoAddedTags
}

const toolbar = useToolbar()
toolbar.init({
  title: 'New transaction defaults',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})
</script>
