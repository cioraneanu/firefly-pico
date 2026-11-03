<template>
  <d-form class="[--label-w:13rem]" @submit="saveAll">
    <d-settings-group :title="$t('settings.dashboard.config')">
      <d-field :label="$t('settings.formatting.first_day_of_month')">
        <div class="w-40">
          <d-select v-model="draft['dashboard.firstDayOfMonth']" :options="days" :get-label="(day) => String(day)" :get-key="(day) => day" />
        </div>
      </d-field>
      <d-field :label="$t('settings.dashboard.show_empty_accounts')">
        <d-switch v-model="draft['dashboard.areEmptyAccountsVisible']" />
      </d-field>
      <d-field :label="$t('settings.dashboard.show_decimal_places')">
        <d-switch v-model="draft['dashboard.showDecimal']" />
      </d-field>
    </d-settings-group>

    <d-settings-group :title="$t('settings.dashboard.transaction_exclusion')">
      <d-field :label="$t('accounts')">
        <d-account-select v-model="draft['dashboard.excludedAccountsList']" multiple clearable />
      </d-field>
      <d-field v-if="profileStore.categoriesEnabled" :label="$t('categories')">
        <d-category-select v-model="draft['dashboard.excludedCategoriesList']" multiple />
      </d-field>
      <d-field v-if="profileStore.tagsEnabled" :label="$t('tags')">
        <d-tag-select v-model="draft['dashboard.excludedTagsList']" multiple />
      </d-field>
    </d-settings-group>

    <d-settings-group :title="$t('settings.dashboard.cards_order')">
      <d-order-list v-model="cards" />
    </d-settings-group>

    <d-settings-actions :loading="isSaving" @reset="resetAll" />
  </d-form>
</template>

<script setup>
import { cloneDeep } from 'lodash-es'
import { dashboardCardList } from '~/core/constants/DashboardConstants'

const profileStore = useProfileStore()
const { isCardEnabled } = useDashboardCards()
const days = Array.from({ length: 27 }, (_, index) => index + 1)

const { draft, save, reset, isSaving } = useSettingsDraft([
  'dashboard.firstDayOfMonth',
  'dashboard.areEmptyAccountsVisible',
  'dashboard.showDecimal',
  'dashboard.excludedAccountsList',
  'dashboard.excludedCategoriesList',
  'dashboard.excludedTagsList',
])

const config = () => (profileStore.dashboardWidgetsConfig.length === dashboardCardList.length ? profileStore.dashboardWidgetsConfig : dashboardCardList)
const cards = ref([])
const resetCards = () => (cards.value = cloneDeep(config().filter((card) => isCardEnabled(card.code))))
resetCards()
watch(() => profileStore.profileActiveId, resetCards)

const resetAll = () => {
  reset()
  resetCards()
}

const saveAll = async () => {
  profileStore.dashboardWidgetsConfig = [...cloneDeep(cards.value), ...config().filter((card) => !isCardEnabled(card.code))]
  await save()
}
</script>
