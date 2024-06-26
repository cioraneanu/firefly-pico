<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">Config:</div>

        <app-field-link label="Amount increment buttons" @click="onGoToQuickTransactionAmounts" />

        <app-field-link label="Transaction fields order" @click="onGoToTransactionFieldsOrder" />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">Watchers:</div>
        <div class="info">Applies only while creating a transaction</div>

        <app-boolean v-model="copyTagToDescription" label="When I select a Tag copy it into Description" />
        <app-boolean v-model="copyTagToCategory" label="When I select a Tag copy it into Category" />
        <app-boolean v-model="copyCategoryToDescription" label="When I select a Category copy it into Description" />
      </van-cell-group>

      <van-cell-group inset>
        <div class="van-cell-group-title mb-0">List view:</div>

        <app-select
          popupTitle="Select what Hero Icons to show"
          v-model="heroIcons"
          v-model:showDropdown="isHeroIconsDropdownVisible"
          :list="heroIconsList"
          :is-multi-select="true"
          :columns="1"
          :has-search="false"
        >
          <template #label>
            <div class="flex-center-vertical">
              <div class="">Hero Icons</div>
              <span class="info ml-5">(Right side card in the list)</span>
            </div>
          </template>
        </app-select>
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
import { HERO_ICONS_LIST } from '~/constants/TransactionConstants.js'

const profileStore = useProfileStore()

const heroIcons = ref([])
const heroIconsList = HERO_ICONS_LIST
const isHeroIconsDropdownVisible = ref(false)

const defaultAccountSource = ref(null)
const defaultAccountDestination = ref(null)
const defaultCategory = ref(null)
const defaultTags = ref([])
const autoAddedTags = ref([])

const quickAmountValues = ref([])
const copyCategoryToDescription = ref(false)
const copyTagToDescription = ref(false)
const copyTagToCategory = ref(false)

onMounted(() => {
  init()
})

const onSave = async () => {
  profileStore.heroIcons = heroIcons.value
  profileStore.copyCategoryToDescription = copyCategoryToDescription.value
  profileStore.copyTagToDescription = copyTagToDescription.value
  profileStore.copyTagToCategory = copyTagToCategory.value
  profileStore.defaultAccountSource = defaultAccountSource.value
  profileStore.defaultAccountDestination = defaultAccountDestination.value
  profileStore.defaultCategory = defaultCategory.value
  profileStore.defaultTags = defaultTags.value
  profileStore.autoAddedTags = autoAddedTags.value
  profileStore.quickValueButtons = quickAmountValues.value.map((item) => {
    let value = sanitizeAmount(item.value)
    let startsWithOperator = ['-', '+'].includes(value[0])
    return startsWithOperator ? value : `+${value}`
  })

  await profileStore.writeProfile()

  UIUtils.showToastSuccess('User preferences saved')
  init()
}

const init = () => {
  heroIcons.value = profileStore.heroIcons
  copyCategoryToDescription.value = profileStore.copyCategoryToDescription
  copyTagToDescription.value = profileStore.copyTagToDescription
  copyTagToCategory.value = profileStore.copyTagToCategory

  defaultAccountSource.value = profileStore.defaultAccountSource
  defaultAccountDestination.value = profileStore.defaultAccountDestination
  defaultCategory.value = profileStore.defaultCategory
  defaultTags.value = profileStore.defaultTags
  autoAddedTags.value = profileStore.autoAddedTags
  quickAmountValues.value = profileStore.quickValueButtons.map((item) => {
    return { value: item }
  })
}

const onGoToQuickTransactionAmounts = async () => await navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_QUICK_AMOUNTS)
const onGoToTransactionFieldsOrder = async () => await navigateTo(RouteConstants.ROUTE_SETTINGS_USER_PREFERENCES_TRANSACTION_FIELDS_ORDER)

const toolbar = useToolbar()
toolbar.init({
  title: 'Transaction config',
  backRoute: RouteConstants.ROUTE_SETTINGS,
})

onMounted(() => {
  animateSettings()
})

</script>
