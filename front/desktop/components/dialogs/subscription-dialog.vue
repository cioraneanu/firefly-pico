<template>
  <d-form-dialog :form :title="$t(form.itemId ? 'subscription_page.title_edit' : 'subscription_page.title_add')" @close="close">
    <template v-if="form.itemId" #info>
      <d-info>
        <d-button variant="ghost" size="sm" :icon="IconCoins" :to="form.transactionsRoute" class="text-fg">{{ $t('show_transactions') }}</d-button>
      </d-info>
    </template>
    <d-field :label="$t('name')" :rules="[rule.required()]" :value="form.name">
      <d-input v-model="form.name" autofocus />
    </d-field>
    <d-field :label="$t('icon')">
      <d-icon-select v-model="form.icon" />
    </d-field>
    <d-field :label="$t('subscription_page.amount_min')" :rules="[rule.required()]" :value="form.amountMin">
      <d-input v-model="form.amountMin" type="number" step="0.01" class="max-w-50" />
    </d-field>
    <d-field :label="$t('subscription_page.amount_max')" :rules="[rule.required(), form.amountMaxRule]" :value="form.amountMax">
      <d-input v-model="form.amountMax" type="number" step="0.01" class="max-w-50" />
    </d-field>
    <d-field :label="$t('currency')">
      <d-currency-select v-model="form.currency" />
    </d-field>
    <d-field :label="$t('subscription_page.first_date')" :rules="[rule.required()]" :value="form.date">
      <d-date v-model="form.date" />
    </d-field>
    <d-field :label="$t('subscription_page.repeat_freq')" :rules="[rule.required()]" :value="form.repeatFreq">
      <d-enum-select v-model="repeatFreq" :options="repeatFreqList" />
    </d-field>
    <d-field :label="$t('subscription_page.skip')" :hint="$t('subscription_page.skip_description')">
      <d-input v-model="form.skip" type="number" min="0" step="1" class="max-w-50" />
    </d-field>
    <d-field :label="$t('subscription_page.end_date')">
      <d-date v-model="form.endDate" clearable />
    </d-field>
    <d-field :label="$t('subscription_page.extension_date')" :hint="$t('subscription_page.extension_date_description')">
      <d-date v-model="form.extensionDate" clearable />
    </d-field>
    <d-field :label="$t('subscription_page.active')">
      <d-switch v-model="form.active" />
    </d-field>
    <d-field :label="$t('notes')" top>
      <d-textarea v-model="form.notes" />
    </d-field>
  </d-form-dialog>
</template>

<script setup>
import { IconCoins } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Subscription from '~/core/models/Subscription'
import { rule } from '~/core/utils/ValidationUtils'

const { close } = useRouteDialog(RouteConstants.ROUTE_SUBSCRIPTION_LIST)
const form = reactive(useSubscriptionForm({ routeForm: null, onEvent: (event) => event === useFormEvent.postSave && close() }))

// The form keeps Firefly's code ("monthly"), the select works with the list items
const repeatFreqList = Subscription.getRepeatFreqList()
const repeatFreq = computed({
  get: () => repeatFreqList.find((item) => item.code === form.repeatFreq) ?? null,
  set: (item) => (form.repeatFreq = item?.code ?? null),
})
</script>
