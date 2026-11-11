<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <main class="mx-body">
      <app-list v-model:refreshing="isRefreshing" :loading="isLoading" :finished="isFinished" @load="onLoadMore" @refresh="onRefresh">
        <app-list-search v-if="list.length > 0" v-model="search" :placeholder="$t('piggy_bank_page.search')" />

        <div v-if="filteredList.length > 0" class="mx-list">
          <piggy-bank-list-item v-for="item in filteredList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
        </div>

        <empty-list v-else-if="list.length > 0" filtered>
          <template #action>
            <button type="button" class="mx-btn out" @click="search = ''">{{ $t('general.clear_filters') }}</button>
          </template>
        </empty-list>

        <empty-list v-else-if="isEmpty" :icon="TablerIconConstants.piggyBank" :hint="$t('piggy_bank_page.empty_hint')">
          <template #action>
            <button type="button" class="mx-btn pri" @click="onAdd">{{ $t('piggy_bank_page.title_add') }}</button>
          </template>
        </empty-list>
      </app-list>
    </main>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { usePiggyBankStore } from '~/core/stores/piggyBankStore'
import { useList } from '~/core/composables/useList'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { animateSwipeList } from '~/core/utils/AnimationUtils.js'
import PiggyBank from '~/core/models/PiggyBank.js'

const piggyBankStore = usePiggyBankStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    piggyBankStore.piggyBankList = piggyBankStore.piggyBankList.filter((item) => item.id !== payload.id)
  }
}

const search = ref('')

const filteredList = computed(() => (search.value ? list.value.filter((item) => LanguageUtils.includesSearch(PiggyBank.getDisplayName(item), search.value)) : list.value))

const { isLoading, isFinished, isRefreshing, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  routeList: RouteConstants.ROUTE_PIGGY_BANK_LIST,
  routeForm: RouteConstants.ROUTE_PIGGY_BANK_ID,
  model: new PiggyBank(),
  onEvent: onEvent,
})

// The whole list is fetched in one go, so one load finishes it
const onRefresh = async () => {
  if (isLoading.value) {
    isRefreshing.value = false
    return
  }
  isLoading.value = true
  isRefreshing.value = true

  await piggyBankStore.fetchPiggyBanks()
  list.value = piggyBankStore.piggyBankList

  isFinished.value = true
  isLoading.value = false
  isRefreshing.value = false
}

const onLoadMore = () => onRefresh()

const { t } = useI18n()
useToolbar().init({
  title: t('piggy_banks'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)
</script>
