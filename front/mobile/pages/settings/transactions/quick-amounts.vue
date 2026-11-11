<template>
  <div class="mx-page">
    <app-top-toolbar />

    <app-form @submit="onSave">
      <main class="mx-body has-save">
        <app-card>
          <div class="mx-f">
            <div class="mx-l">{{ $t('settings.transactions.amount_increment_buttons') }}</div>
            <draggable v-model="quickAmountValues" class="mx-repeat" handle=".grip" item-key="id">
              <template #item="{ element, index }">
                <div class="mx-rep">
                  <span class="grip cursor-grab"><app-icon :icon="IconGripVertical" :size="16" :stroke="2" /></span>
                  <label class="mx-in flex-1">
                    <app-icon :icon="IconSquareRoundedPlus" :size="16" :stroke="2" />
                    <input
                      v-model="element.value"
                      type="text"
                      inputmode="decimal"
                      :placeholder="$t('settings.transactions.quick_amounts.value')"
                      :aria-label="$t('settings.transactions.quick_amounts.value')"
                    />
                  </label>
                  <button type="button" class="mx-ib out mx-ib40" :aria-label="$t('delete')" @click="quickAmountValues.splice(index, 1)">
                    <app-icon :icon="IconTrash" :size="16" :stroke="2" />
                  </button>
                </div>
              </template>
            </draggable>
            <p v-if="!quickAmountValues.length" class="mx-d">{{ $t('repeater_no_values') }}</p>
            <button type="button" class="mx-btn sm out self-start" @click="quickAmountValues.push(toItem(''))">
              <app-icon :icon="IconPlus" :size="16" :stroke="2" />
              <span>{{ $t('add') }}</span>
            </button>
            <p class="mx-d">{{ $t('settings.transactions.quick_amounts.info') }}</p>
          </div>
        </app-card>
      </main>

      <app-button-form-save />
    </app-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import draggable from 'vuedraggable'
import { IconGripVertical, IconPlus, IconSquareRoundedPlus, IconTrash } from '@tabler/icons-vue'
import { useProfileStore } from '~/core/stores/profileStore'
import UIUtils from '~/core/utils/UIUtils'
import { useToolbar } from '~/mobile/composables/useToolbar'
import RouteConstants from '~/core/constants/RouteConstants'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const profileStore = useProfileStore()
const quickAmountValues = ref([])

// Rows need a stable key for drag-and-drop; only `value` is saved
let lastId = 0
const toItem = (value) => ({ id: ++lastId, value })

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
  quickAmountValues.value = profileStore.quickValueButtons.map(toItem)
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
