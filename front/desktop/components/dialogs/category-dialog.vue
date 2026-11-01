<template>
  <d-form-dialog :form :title="$t(form.itemId ? 'category_page.title_edit' : 'category_page.title_add')" @close="close">
    <template v-if="form.itemId" #info>
      <d-info>
        <icon-info-circle :size="16" />
        <span class="flex-1">{{ $t('desktop.category_transactions') }}</span>
        <d-button variant="ghost" size="sm" :icon="IconCoins" :to="form.transactionsRoute" class="text-fg">{{ $t('show_transactions') }}</d-button>
      </d-info>
    </template>
    <d-field :label="$t('name')" :rules="[rule.required()]" :value="form.name">
      <d-input v-model="form.name" autofocus />
    </d-field>
    <d-field :label="$t('icon')">
      <d-icon-select v-model="form.icon" />
    </d-field>
  </d-form-dialog>
</template>

<script setup>
import { IconCoins, IconInfoCircle } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import { rule } from '~/core/utils/ValidationUtils'

const { close } = useRouteDialog(RouteConstants.ROUTE_CATEGORY_LIST)
const form = reactive(useCategoryForm({ routeForm: null, onEvent: (event) => event === useFormEvent.postSave && close() }))
</script>
