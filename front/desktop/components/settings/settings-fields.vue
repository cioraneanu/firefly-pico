<template>
  <d-form class="[--label-w:13.75rem]" @submit="saveAll">
    <d-settings-group :title="$t('settings.transactions.configure_form_fields')">
      <d-order-list v-model="formFields" />
      <d-switch v-model="draft.isForeignCurrencyAlwaysVisible">{{ $t('settings.transactions.form_fields.always_show_foreign_currency') }}</d-switch>
    </d-settings-group>

    <d-settings-group :title="$t('settings.transactions.configure_list_fields')">
      <d-order-list v-model="listFields" />
      <d-switch v-model="draft.transactionListGroupByDay">{{ $t('settings.transactions.list_fields.group_by_day') }}</d-switch>
      <d-field :label="$t('settings.transactions.list_fields.hero_icons')" :hint="$t('settings.transactions.list_fields.right_side_card')">
        <d-select v-model="draft.heroIcons" :options="transactionListHeroIconList" :get-label="(option) => $t(option.t)" multiple :searchable="false" />
      </d-field>
    </d-settings-group>

    <d-settings-actions :loading="isSaving" @reset="resetAll" />
  </d-form>
</template>

<script setup>
import { cloneDeep } from 'lodash-es'
import { transactionFormFieldList, transactionListFieldList, transactionListHeroIconList } from '~/core/constants/TransactionConstants'
import { migrateTypeList } from '~/core/utils/MigrateUtils'

const profileStore = useProfileStore()
const { draft, save, reset, isSaving } = useSettingsDraft(['isForeignCurrencyAlwaysVisible', 'heroIcons', 'transactionListGroupByDay'])

const formFields = ref([])
const listFields = ref([])

const resetAll = () => {
  reset()
  formFields.value = cloneDeep(migrateTypeList(profileStore.transactionFormFieldsConfig, transactionFormFieldList))
  listFields.value = cloneDeep(profileStore.transactionListFieldsConfig.length === transactionListFieldList.length ? profileStore.transactionListFieldsConfig : transactionListFieldList)
}
resetAll()
watch(() => profileStore.profileActiveId, resetAll)

const saveAll = async () => {
  profileStore.transactionFormFieldsConfig = cloneDeep(formFields.value)
  profileStore.transactionListFieldsConfig = cloneDeep(listFields.value)
  await save()
}
</script>
