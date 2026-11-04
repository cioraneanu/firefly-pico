<template>
  <d-card :title>
    <template v-if="kind === 'tag' || type === 'expense'" #actions>
      <d-button ref="trigger" variant="ghost" size="icon-sm" :icon="IconSettings" @click="isOpen = !isOpen" />
      <d-popover v-model:open="isOpen" :anchor="trigger" align="end" width="15rem">
        <div class="flex flex-col gap-2 p-2">
          <template v-if="kind === 'tag'">
            <span class="text-xs font-semibold text-dim">{{ $t('tags') }}</span>
            <d-tabs v-model="dashboardStore.tagsWidgetModeOnlyRootTag" :options="tagModes" block />
          </template>
          <template v-if="type === 'expense'">
            <span :class="['text-xs font-semibold text-dim', kind === 'tag' && 'mt-1']">{{ $t('amount') }}</span>
            <d-tabs v-model="dashboardStore.widgetsNetAmountMode" :options="amountModes" block />
          </template>
        </div>
      </d-popover>
    </template>
    <div class="-mx-2 -my-0.5 flex flex-col">
      <nuxt-link
        v-for="bar in bars"
        :key="bar.id"
        :to="link(bar)"
        class="grid h-[34px] grid-cols-[minmax(112px,1fr)_minmax(40px,1.4fr)_auto] items-center gap-3 rounded-lg px-2 transition-colors hover:bg-soft/60"
      >
        <span class="flex min-w-0 items-center gap-2">
          <app-icon :icon="icon(bar)" :size="14" :stroke="2" class="shrink-0 text-dim" />
          <span class="truncate">{{ bar.label }}</span>
        </span>
        <span class="h-2 overflow-hidden rounded-full bg-soft">
          <span
            :class="['block h-full rounded-full transition-[width]', type === 'transfer' ? 'bg-transfer' : bar.amount < 0 ? 'bg-income' : 'bg-fg']"
            :style="{ width: `${Math.abs(bar.percent)}%` }"
          />
        </span>
        <span :class="['min-w-[72px] whitespace-nowrap text-right font-medium tabular-nums', bar.amount < 0 && 'text-income']">{{ money(bar.amount) }}</span>
      </nuxt-link>
    </div>
    <d-empty v-if="!bars.length" :icon="kind === 'tag' ? IconTag : IconCategory" />
  </d-card>
</template>

<script setup>
import { IconCategory, IconSettings, IconTag } from '@tabler/icons-vue'
import Category from '~/core/models/Category'
import Currency from '~/core/models/Currency'
import Tag from '~/core/models/Tag'
import Transaction from '~/core/models/Transaction'
import { formatNumberForDashboard } from '~/core/utils/NumberUtils'

const props = defineProps({ title: String, bars: Array, kind: String, type: String })

const { t } = useI18n()
const dashboardStore = useDashboardStore()
const links = useDashboardLinks()
const trigger = ref(null)
const isOpen = ref(false)

const tagModes = computed(() => [
  { label: t('dashboard.expenses_by_tags.one_root_tag'), value: true },
  { label: t('dashboard.expenses_by_tags.all_tags'), value: false },
])
const amountModes = computed(() => [
  { label: t('dashboard.amount_modes.expenses_only'), value: false },
  { label: t('dashboard.amount_modes.net_amount'), value: true },
])

const money = (amount) => `${formatNumberForDashboard(Math.abs(amount))} ${Currency.getSymbol(dashboardStore.dashboardCurrency)}`
const icon = (bar) => (props.kind === 'tag' ? (Tag.getIcon(bar.tag) ?? IconTag) : (Category.getIcon(bar.category) ?? IconCategory))
const linkType = computed(() => (props.type === 'transfer' ? Transaction.types.transfer : dashboardStore.widgetsNetAmountMode ? null : Transaction.types.expense))
const link = (bar) => (props.kind === 'tag' ? links.byTag(bar.tag, linkType.value) : links.byCategory(bar.category, linkType.value))
</script>
