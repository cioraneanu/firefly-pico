<template>
  <d-card :title flush>
    <template v-if="modes" #actions>
      <d-button ref="trigger" variant="ghost" size="icon-sm" :icon="IconAdjustmentsHorizontal" class="text-dim" @click="isOpen = !isOpen" />
      <d-popover v-model:open="isOpen" :anchor="trigger" align="end" width="16rem">
        <div class="flex flex-col gap-2 p-1.5">
          <template v-if="kind === 'tag'">
            <span class="text-xs font-medium text-dim">{{ $t('tags') }}</span>
            <d-tabs v-model="dashboardStore.tagsWidgetModeOnlyRootTag" :options="tagModes" block />
          </template>
          <span class="text-xs font-medium text-dim">{{ $t('amount') }}</span>
          <d-tabs v-model="dashboardStore.widgetsNetAmountMode" :options="amountModes" block />
        </div>
      </d-popover>
    </template>
    <div class="flex flex-col gap-0.5 px-2">
      <div v-for="bar in bars" :key="bar.id" class="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-soft/60">
        <d-tile :icon="icon(bar)" size="sm" />
        <nuxt-link :to="link(bar)" class="flex min-w-0 flex-1 flex-col gap-1">
          <span class="flex items-center justify-between gap-2 text-[13px]">
            <span class="truncate">{{ bar.label }}</span>
            <span class="font-medium tabular-nums">{{ bar.value }}</span>
          </span>
          <span class="h-1.5 overflow-hidden rounded-full bg-soft">
            <span :class="['block h-full rounded-full', colors[type]]" :style="{ width: `${Math.max(bar.percent, 1)}%` }" />
          </span>
        </nuxt-link>
        <d-button v-if="bar[kind]" variant="ghost" size="icon-xs" :icon="IconPencil" class="invisible text-dim group-hover:visible" :to="`${editRoute}/${bar[kind].id}`" />
        <span v-else class="size-6 shrink-0" />
      </div>
    </div>
    <d-empty v-if="!bars.length" :icon="kind === 'tag' ? IconTag : IconCategory" />
  </d-card>
</template>

<script setup>
import { IconAdjustmentsHorizontal, IconCategory, IconPencil, IconTag } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Category from '~/core/models/Category'
import Tag from '~/core/models/Tag'
import Transaction from '~/core/models/Transaction'

const props = defineProps({ title: String, bars: Array, kind: String, type: String, modes: Boolean })

const { t } = useI18n()
const dashboardStore = useDashboardStore()
const links = useDashboardLinks()
const trigger = ref(null)
const isOpen = ref(false)

const colors = { expense: 'bg-expense', transfer: 'bg-transfer' }
const editRoute = computed(() => (props.kind === 'tag' ? RouteConstants.ROUTE_TAG_ID : RouteConstants.ROUTE_CATEGORY_ID))
const tagModes = computed(() => [
  { label: t('dashboard.expenses_by_tags.one_root_tag'), value: true },
  { label: t('dashboard.expenses_by_tags.all_tags'), value: false },
])
const amountModes = computed(() => [
  { label: t('dashboard.amount_modes.expenses_only'), value: false },
  { label: t('dashboard.amount_modes.net_amount'), value: true },
])

const icon = (bar) => (props.kind === 'tag' ? (Tag.getIcon(bar.tag) ?? IconTag) : (Category.getIcon(bar.category) ?? IconCategory))
const linkType = computed(() => (props.type === 'transfer' ? Transaction.types.transfer : dashboardStore.widgetsNetAmountMode ? null : Transaction.types.expense))
const link = (bar) => (props.kind === 'tag' ? links.byTag(bar.tag, linkType.value) : links.byCategory(bar.category, linkType.value))
</script>
