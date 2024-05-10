<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="addButtonText" @click="onNew" />
      </template>
    </app-top-toolbar>

    <van-form ref="form" class="" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset>
        <app-field
          v-model="name"
          name="Description"
          label="Description"
          type="textarea"
          rows="1"
          autosize
          left-icon="notes-o"
          placeholder="Description"
          :rules="[{ required: true, message: 'Name is required' }]"
          required
        />

        <icon-select v-model="icon" :list="avatarListIcons" />

        <currency-select
          v-if="false"
          v-model="currency"
          :rules="[{ required: true, message: 'Field is required' }]"
          required
        />

        <account-type-select v-model="type" :rules="[{ required: true, message: 'Type is required' }]" required />

        <account-role-select
          v-if="isRoleVisible"
          v-model="role"
          :rules="[{ required: true, message: 'Role is required' }]"
          required
        />
      </van-cell-group>

      <div style="margin: 16px" class="">
        <app-button-form-save />

        <app-button-form-delete v-if="itemId" class="mt-10" @click="onDelete" />
      </div>
    </van-form>
  </div>
</template>

<script setup>
import RouteConstants from '~/constants/RouteConstants'
import { useDataStore } from '~/stores/dataStore'
import _, { get } from 'lodash'
import { useAppStore } from '~/stores/appStore'
import { useForm } from '~/composables/useForm'
import Account from '~/models/Account'
import { generateChildren } from '~/utils/VueUtils'
import AccountTypeSelect from '~/components/select/account-type-select.vue'
import AccountTransformer from '~/transformers/AccountTransformer'
import { useToolbar } from '~/composables/useToolbar'
import { avatarListIcons } from '~/constants/SvgConstants.js'

const dataStore = useDataStore()
const appStore = useAppStore()
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

const {
  itemId,
  item,
  isEmpty,
  title,
  addButtonText,
  isLoading,
  onClickBack,
  saveItem,
  onDelete,
  onNew,
  onValidationError,
} = useForm({
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
const children = generateChildren(item, [
  { computed: 'name', parentKey: `${pathKey}.name` },
  { computed: 'icon', parentKey: `${pathKey}.icon` },
  { computed: 'type', parentKey: `${pathKey}.type` },
  { computed: 'role', parentKey: `${pathKey}.account_role` },
  { computed: 'currency', parentKey: `${pathKey}.currency` },
])

const { name, type, role, currency, icon } = children

const isRoleVisible = computed(() => {
  return _.get(type.value, 'code') === Account.types.TYPE_ASSET
})

watch(name, (newValue) => {
  if (!appStore.lowerCaseAccountName) {
    return
  }
  name.value = newValue.toLowerCase()
})

const toolbar = useToolbar()
toolbar.init({
  title: title,
  leftText: 'List',
  backRoute: RouteConstants.ROUTE_ACCOUNT_LIST,
})
</script>
