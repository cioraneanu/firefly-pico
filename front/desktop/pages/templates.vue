<template>
  <d-page :title="$t('templates')" :description="$t('desktop.templates_description')">
    <template #actions>
      <d-refresh-button :action="templateStore.fetchTransactionTemplates" />
      <d-button variant="primary" :icon="IconPlus" :to="RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID">{{ $t('transaction_template_page.title_add') }}</d-button>
    </template>

    <d-search v-model="search" :count="filtered.length" />
    <d-list v-if="filtered.length">
      <d-list-item
        v-for="template in filtered"
        :key="template.id"
        :title="TransactionTemplate.getDisplayName(template)"
        :subtitle="subtitle(template)"
        :icon="IconTemplate"
        :to="`${RouteConstants.ROUTE_TRANSACTION_TEMPLATE_ID}/${template.id}`"
        :active="template.id === id"
      >
        <template #title>
          <d-badge v-for="name in TransactionTemplate.getExtraNames(template)" :key="name" variant="outline">{{ name }}</d-badge>
        </template>
        <d-amount :value="template.amount" :type="template.type" />
      </d-list-item>
    </d-list>
    <d-list v-else>
      <d-empty :icon="IconTemplate" />
    </d-list>

    <d-template-dialog v-if="isOpen" :key="id" />
  </d-page>
</template>

<script setup>
import { IconPlus, IconTemplate } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Account from '~/core/models/Account'
import Category from '~/core/models/Category'
import Tag from '~/core/models/Tag'
import TransactionTemplate from '~/core/models/TransactionTemplate'

const templateStore = useTemplateStore()
const { id, isOpen } = useRouteDialog(RouteConstants.ROUTE_TRANSACTION_TEMPLATE_LIST)
const { search, filtered } = useSearch(
  () => templateStore.transactionTemplateList,
  (template) => TransactionTemplate.getAllNames(template).join(' '),
)

const subtitle = (template) =>
  [
    [template.account_source, template.account_destination]
      .filter(Boolean)
      .map((item) => Account.getDisplayName(item))
      .join(' → '),
    template.category && Category.getDisplayName(template.category),
    template.tags
      ?.filter(Boolean)
      .map((tag) => `#${Tag.getDisplayName(tag)}`)
      .join(' '),
  ]
    .filter(Boolean)
    .join(' · ')
</script>
