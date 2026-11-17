<template>
  <app-card :title="$t('settings.dashboard.cards.piggy_banks')" :form="false">
    <dashboard-bar-list
      :bars="barsList"
      :get-icon="(bar) => PiggyBank.getIcon(bar.piggyBank) ?? TablerIconConstants.piggyBank"
      :empty-icon="TablerIconConstants.piggyBank"
      :empty-text="$t('dash_page.no_piggy_banks')"
      @select="(bar) => onGoToPiggyBank(bar.piggyBank)"
    />
  </app-card>
</template>
<script setup>
import RouteConstants from '~/core/constants/RouteConstants.js'
import PiggyBank from '~/core/models/PiggyBank.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

const { piggyBanks: barsList } = useDashboardBars()

const onGoToPiggyBank = async (piggyBank) => {
  if (piggyBank) {
    await navigateTo(`${RouteConstants.ROUTE_PIGGY_BANK_ID}/${piggyBank.id}`)
  }
}
</script>
