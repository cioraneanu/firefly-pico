<template>
  <div class="app-form">
    <app-top-toolbar />

    <van-form class="" @submit="onSave">
      <van-cell-group inset>
        <div class="van-cell-fake flex-column van-cell">
          <app-repeater v-model="quickAmountValues" :empty-item="{ value: '' }">
            <template #content="{ element, index }">
              <app-field v-model="element.value" :placeholder="$t('settings.transactions.quick_amounts.value')" inputmode="decimal" />
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
import UIUtils from '~/utils/UIUtils'
import { useToolbar } from '~/composables/useToolbar'
import RouteConstants from '~/constants/RouteConstants'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()
const quickAmountValues = ref([])

onMounted(() => {
  init()
})

const onSave = async () => {
  profileStore.quickValueButtons = quickAmountValues.value.map((item) => {
    const value = sanitizeAmount(item.value)
    const startsWithOperator = ['-', '+'].includes(value[0])
    return startsWithOperator ? value : `+${value}`
  })

  await profileStore.writeProfile()

  UIUtils.showToastSuccess(t('settings.settings_saved'))
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
  backRouteDesktop: RouteConstants.ROUTE_SETTINGS_TRANSACTION,
})

onMounted(() => {
  animateSettings()
})
</script>
