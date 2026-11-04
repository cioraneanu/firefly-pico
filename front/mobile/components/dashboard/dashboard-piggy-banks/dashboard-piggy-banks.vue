<template>
  <van-cell-group inset>
    <div class="van-cell-group-title flex items-center">
      <div class="flex-1">{{ $t('settings.dashboard.cards.piggy_banks') }}:</div>
    </div>

    <template v-if="hasPiggyBanks">
      <div class="flex flex-col ml-3.75 mr-3.75">
        <table>
          <tr v-for="bar in barsList" :key="bar.piggyBank.id" class="cursor-pointer" @click="onGoToPiggyBank(bar.piggyBank)">
            <td style="width: 1%">
              <div class="flex items-center gap-1 my-1">
                <app-icon :icon="getIcon(bar)" :size="TablerIconConstants.defaultSize" />
                <span class="text-12 font-normal flex-1">{{ ellipsizeText(bar.label, 25) }}</span>
              </div>
            </td>

            <td>
              <bar-chart-item-horizontal :percent="bar.percent" />
            </td>

            <td style="width: 1%">
              <div class="flex flex-col">
                <span class="text-12 font-normal">{{ bar.value }}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </template>
    <div v-else class="text-muted text-12 px-4 mb-3.75" style="margin-top: -10px">No piggy banks ^_^</div>
  </van-cell-group>
</template>
<script setup>
import RouteConstants from '~/core/constants/RouteConstants.js'
import PiggyBank from '~/core/models/PiggyBank.js'
import { computed } from 'vue'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'

const piggyBankStore = usePiggyBankStore()

// const icon = computed(() => PiggyBank.getIcon(props.value))
const getIcon = (bar) => PiggyBank.getIcon(bar.piggyBank) ?? TablerIconConstants.piggyBank
const hasPiggyBanks = computed(() => piggyBankStore.piggyBankList.length > 0)

const { piggyBanks: barsList } = useDashboardBars()

const onGoToPiggyBank = async (piggyBank) => {
  if (piggyBank) {
    await navigateTo(`${RouteConstants.ROUTE_PIGGY_BANK_ID}/${piggyBank.id}`)
  }
}
</script>
