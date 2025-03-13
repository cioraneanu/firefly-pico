<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form @submit="onSave" class="">
      <van-cell-group inset>
        <div class="van-cell-fake flex-column van-cell">
          <app-repeater v-model="quickAmountValues" :empty-item="{ value: '' }">
            <template #content="{ element, index }">
              <app-field :placeholder="$t('settings.transactions.quick_amounts.value')" v-model="element.value" inputmode="decimal" />
            </template>
          </app-repeater>
        </div>
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()
const dataStore = useDataStore()

const quickAmountValues = ref([])

onMounted(() => {
  init()
})

const onSave = async () => {
  profileStore.quickValueButtons = quickAmountValues.value.map((item) => {
    let value = sanitizeAmount(item.value)
    let startsWithOperator = ['-', '+'].includes(value[0])
    return startsWithOperator ? value : `+${value}`
  })

  await profileStore.writeProfile()

  UIUtils.showToastSuccess(t('settings.user_preferences_saved'))
  init()
}

const init = () => {
  quickAmountValues.value = profileStore.quickValueButtons.map((item) => {
    return { value: item }
  })
}

const toolbar = useToolbar()
toolbar.init({
  title: t('settings.transactions.quick_amounts.title'),
  backRoute: RouteConstants.ROUTE_SETTINGS_TRANSACTION,
})

onMounted(() => {
  animateSettings()
})
</script>
