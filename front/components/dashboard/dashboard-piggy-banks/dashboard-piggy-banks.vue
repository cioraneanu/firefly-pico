<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex-center-vertical">
      <div class="flex-1">{{ $t('settings.dashboard.cards.piggy_banks') }}:</div>
    </div>

    <template v-if="hasPiggyBanks">
      <div class="display-flex flex-column ml-15 mr-15">
        <table>
          <tr v-for="bar in barsList" :key="bar.piggyBank.id" class="cursor-pointer" @click="onGoToPiggyBank(bar.piggyBank)">
            <td style="width: 1%">
              <div class="flex-center-vertical gap-1 my-1">
                <app-icon :icon="getIcon(bar)" :size="TablerIconConstants.defaultSize" />
                <span class="text-size-12 font-weight-400 flex-1">{{ ellipsizeText(bar.label, 25) }}</span>
              </div>
            </td>

            <td>
              <bar-chart-item-horizontal :percent="bar.percent" />
            </td>

            <td style="width: 1%">
              <div class="display-flex flex-column">
                <span class="text-size-12 font-weight-400">{{ bar.value }}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </template>
    <div v-else class="text-muted text-size-12 px-3 mb-15" style="margin-top: -10px">No piggy banks ^_^</div>
  </van-cell-group>
</template>
<script setup>
import RouteConstants from '~/constants/RouteConstants.js'
import PiggyBank from '~/models/PiggyBank.js'
import { computed } from 'vue'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const piggyBankStore = usePiggyBankStore()

// const icon = computed(() => PiggyBank.getIcon(props.value))
const getIcon = (bar) => PiggyBank.getIcon(bar.piggyBank) ?? TablerIconConstants.piggyBank
const hasPiggyBanks = computed(() => piggyBankStore.piggyBankList.length > 0)

const barsList = computed(() => {
  const bars = piggyBankStore.piggyBankList.map((piggyBank) => {
    return {
      piggyBank: piggyBank,
      label: PiggyBank.getDisplayName(piggyBank),
      value: formatNumberForDashboard(PiggyBank.getCurrentAmount(piggyBank)),
      percent: PiggyBank.getPercent(piggyBank),
    }
  })
  return bars.sort((a, b) => b.percent - a.percent).slice(0, 15)
})

const onGoToPiggyBank = async (piggyBank) => {
  if (piggyBank) {
    await navigateTo(`${RouteConstants.ROUTE_PIGGY_BANK_ID}/${piggyBank.id}`)
  }
}
</script>
