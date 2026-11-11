<template>
  <d-form class="[--label-w:13.75rem]" @submit="saveAll">
    <d-settings-group :title="$t('settings.transactions.default_form_values.title')">
      <d-field :label="$t('settings.transactions.default_form_values.default_source_account')">
        <d-account-select v-model="draft.defaultAccountSource" clearable />
      </d-field>
      <d-field :label="$t('settings.transactions.default_form_values.default_destination_account')">
        <d-account-select v-model="draft.defaultAccountDestination" clearable />
      </d-field>
      <d-field :label="$t('settings.transactions.default_form_values.default_category')">
        <d-category-select v-model="draft.defaultCategory" />
      </d-field>
      <d-field :label="$t('settings.transactions.default_form_values.default_tags')">
        <d-tag-select v-model="draft.defaultTags" multiple />
      </d-field>
      <d-field :label="$t('settings.transactions.default_form_values.auto_tags')">
        <d-tag-select v-model="draft.autoAddedTags" multiple />
      </d-field>
      <d-field :label="$t('settings.transactions.default_form_values.foreign_currency')">
        <div class="max-w-80">
          <d-currency-select v-model="draft.defaultForeignCurrency" clearable />
        </div>
      </d-field>
      <d-field :label="$t('settings.transactions.default_form_values.set_default_time_to_midnight')">
        <d-switch v-model="draft.defaultTransactionTimeAtMidnight" />
      </d-field>
    </d-settings-group>

    <d-settings-group :title="$t('settings.transactions.watchers')" :description="$t('settings.transactions.watchers_info')">
      <div class="flex flex-col">
        <d-switch v-model="draft.copyTagToDescription">{{ $t('settings.transactions.copy_tag_to_description') }}</d-switch>
        <d-switch v-model="draft.copyTagToCategory">{{ $t('settings.transactions.copy_tag_to_category') }}</d-switch>
        <d-switch v-model="draft.copyCategoryToDescription">{{ $t('settings.transactions.copy_category_to_description') }}</d-switch>
      </div>
    </d-settings-group>

    <d-settings-group :title="$t('settings.transactions.default_list_filters.title')" :description="$t('settings.transactions.default_list_filters.info')">
      <d-field :label="$t('account')">
        <d-account-select v-model="draft.transactionListDefaultFilterAccount" clearable />
      </d-field>
      <d-field :label="$t('date_after')">
        <d-date v-model="draft.transactionListDefaultFilterDateStart" clearable />
      </d-field>
      <d-field :label="$t('date_before')">
        <d-date v-model="draft.transactionListDefaultFilterDateEnd" clearable />
      </d-field>
    </d-settings-group>

    <d-settings-group :title="$t('settings.transactions.quick_amounts.title')">
      <div class="max-w-80">
        <d-list-input v-model="quickAmounts" />
      </div>
    </d-settings-group>

    <d-settings-actions :loading="isSaving" @reset="resetAll" />
  </d-form>
</template>

<script setup>
import { sanitizeAmount } from '~/core/utils/MathUtils'

const profileStore = useProfileStore()
const { draft, save, reset, isSaving } = useSettingsDraft([
  'defaultAccountSource',
  'defaultAccountDestination',
  'defaultCategory',
  'defaultTags',
  'autoAddedTags',
  'defaultForeignCurrency',
  'defaultTransactionTimeAtMidnight',
  'copyTagToDescription',
  'copyTagToCategory',
  'copyCategoryToDescription',
  'transactionListDefaultFilterAccount',
  'transactionListDefaultFilterDateStart',
  'transactionListDefaultFilterDateEnd',
])

const quickAmounts = ref([])

const resetAll = () => {
  reset()
  quickAmounts.value = profileStore.quickValueButtons.map((value) => ({ value }))
}
resetAll()
watch(() => profileStore.profileActiveId, resetAll)

const saveAll = async () => {
  profileStore.quickValueButtons = quickAmounts.value
    .map((item) => sanitizeAmount(item.value))
    .filter(Boolean)
    .map((value) => (['-', '+'].includes(value[0]) ? value : `+${value}`))
  await save()
}
</script>
