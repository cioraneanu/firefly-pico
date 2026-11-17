<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add @click="onAdd" />
      </template>
    </app-top-toolbar>

    <main class="mx-body">
      <app-list v-model:refreshing="isRefreshing" :loading="isLoading" :finished="isFinished" @load="onLoadMore" @refresh="onRefresh">
        <app-list-search v-if="list.length > 0" v-model="search" :placeholder="$t('transaction_template_page.search')" />

        <div v-if="filteredList.length > 0" class="mx-list">
          <transaction-template-list-item v-for="item in filteredList" :key="item.id" :value="item" @on-edit="onEdit" @on-delete="onDelete" />
        </div>

        <empty-list v-else-if="list.length > 0" filtered>
          <template #action>
            <button type="button" class="mx-btn out" @click="search = ''">{{ $t('general.clear_filters') }}</button>
          </template>
        </empty-list>

        <empty-list v-else-if="isEmpty" :icon="TablerIconConstants.transactionTemplate" :hint="$t('transaction_template_page.empty_hint')">
          <template #action>
            <button type="button" class="mx-btn pri" @click="onAdd">{{ $t('transaction_template_page.title_add') }}</button>
          </template>
        </empty-list>
      </app-list>
    </main>
  </div>
</template>

<script setup>
import RouteConstants from '~/core/constants/RouteConstants'
import TablerIconConstants from '~/core/constants/TablerIconConstants'
import { useTemplateStore } from '~/core/stores/templateStore'
import { useList } from '~/core/composables/useList'
import TransactionTemplate from '~/core/models/TransactionTemplate'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { animateSwipeList } from '~/core/utils/AnimationUtils.js'

const templateStore = useTemplateStore()

const onEvent = (event, payload) => {
  if (event === 'onPostDelete') {
    templateStore.transactionTemplateList = templateStore.transactionTemplateList.filter((item) => parseInt(item.id) !== parseInt(payload.id))
  }
}

const search = ref('')
// Sorted by name; the search also matches the extra names
const sortedList = computed(() => [...list.value].sort((a, b) => String(TransactionTemplate.getDisplayName(a) ?? '').localeCompare(String(TransactionTemplate.getDisplayName(b) ?? ''))))
const filteredList = computed(() =>
  search.value ? sortedList.value.filter((item) => TransactionTemplate.getAllNames(item).some((name) => LanguageUtils.includesSearch(name, search.value))) : sortedList.value,
)

const { isLoading, isFinished, isRefreshing, list, isEmpty, onAdd, onEdit, onDelete } = useList({
  routeList: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST,
  routeForm: RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID,
  model: new TransactionTemplate(),
  onEvent: onEvent,
})

const onRefresh = async () => {
  isLoading.value = true
  isRefreshing.value = true
  await templateStore.fetchTransactionTemplates()
  isLoading.value = false
  isRefreshing.value = false
  onLoadMore()
}

// The whole list comes from the store, so one load finishes it
const onLoadMore = () => {
  list.value = templateStore.transactionTemplateList
  isFinished.value = true
}

const { t } = useI18n()
useToolbar().init({
  title: t('templates'),
  backRoute: RouteConstants.ROUTE_EXTRAS,
})

animateSwipeList(list)
</script>
