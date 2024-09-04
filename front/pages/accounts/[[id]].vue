<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="addButtonText" @click="onNew" />
      </template>
    </app-top-toolbar>

    <van-form ref="form" @submit="saveItem" @failed="onValidationError" class="">
      <van-cell-group inset>
        <app-field
          v-model="name"
          name="Description"
          label="Description"
          type="textarea"
          rows="1"
          autosize
          :icon="TablerIconConstants.fieldText2"
          placeholder="Description"
          :rules="[{ required: true, message: 'Name is required' }]"
          required
        >
        </app-field>

        <icon-select v-model="icon" :list="avatarListIcons" />

        <currency-select v-model="currency" :rules="[{ required: true, message: 'Field is required' }]" required />

        <account-type-select v-model="type" :rules="[{ required: true, message: 'Type is required' }]" required />

        <account-role-select v-if="isRoleVisible" v-model="role" :rules="[{ required: true, message: 'Role is required' }]" required />

        <app-boolean v-model="includeNetWorth" label="Is include in net worth" />

        <app-boolean v-model="isDashboardVisible" label="Is visible on Dashboard" />
      </van-cell-group>

      <div style="margin: 16px" class="">
        <app-button-form-save />
        <app-button-form-delete class="mt-10" v-if="itemId" @click="onDelete" />
      </div>
    </van-form>
  </div>
</template>

import { ref } from 'vue';

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useDataStore } from '~/stores/dataStore'
import { get } from 'lodash'
import { useProfileStore } from '~/stores/profileStore'
import { ref } from 'vue'
import { useForm } from '~/composables/useForm'
import Account from '~/models/Account'
import { generateChildren } from '~/utils/VueUtils'
import AccountTypeSelect from '~/components/select/account-type-select.vue'
import AccountTransformer from '~/transformers/AccountTransformer'
import { useToolbar } from '~/composables/useToolbar'
import { avatarListIcons } from '~/constants/SvgConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

let dataStore = useDataStore()
let profileStore = useProfileStore()
const route = useRoute()

const resetFields = () => {
  // name.value = ''
}

const form = ref(null)

const fetchItem = () => {
  const dataStore = useDataStore()
  item.value = dataStore.accountDictionary[itemId.value]
}

const onEvent = (event, payload) => {
  if (event === 'onPostSave') {
    let newItem = get(payload, 'data.data')
    newItem = AccountTransformer.transformFromApi(newItem)
    dataStore.accountList = [newItem, ...dataStore.accountList.filter((item) => item.id !== itemId.value)]
  }
  if (event === 'onPostDelete') {
    dataStore.accountList = dataStore.accountList.filter((item) => item.id !== itemId.value)
  }
}

let { itemId, item, isEmpty, title, addButtonText, isLoading, onClickBack, saveItem, onDelete, onNew, onValidationError } = useForm({
  form: form,
  titleAdd: 'Add account',
  titleEdit: 'Edit account',
  routeList: RouteConstants.ROUTE_ACCOUNT_LIST,
  routeForm: RouteConstants.ROUTE_ACCOUNT_ID,
  model: new Account(),
  fetchItem: fetchItem,
  resetFields: resetFields,
  onEvent: onEvent,
})

// const type = ref(null)

const pathKey = 'attributes'

// const name = ref("")
const { name, type, role, currency, icon, includeNetWorth, isDashboardVisible } = generateChildren(item, [
  { computed: 'name', parentKey: `${pathKey}.name` },
  { computed: 'icon', parentKey: `${pathKey}.icon` },
  { computed: 'type', parentKey: `${pathKey}.type` },
  { computed: 'role', parentKey: `${pathKey}.account_role` },
  { computed: 'currency', parentKey: `${pathKey}.currency` },
  { computed: 'includeNetWorth', parentKey: `${pathKey}.include_net_worth` },
  { computed: 'isDashboardVisible', parentKey: `${pathKey}.is_dashboard_visible` },
])

const isRoleVisible = computed(() => get(type.value, 'fireflyCode') === Account.types.asset.fireflyCode)

watch(name, (newValue) => {
  if (profileStore.lowerCaseAccountName) {
    newValue = newValue.toLowerCase()
  }
  if (profileStore.stripAccents) {
    newValue = LanguageUtils.removeAccents(newValue)
  }
  name.value = newValue
})

const toolbar = useToolbar()
toolbar.init({
  title: title,
  leftText: 'List',
  backRoute: RouteConstants.ROUTE_ACCOUNT_LIST,
})
</script>
