<template>
  <van-swipe-cell ref="swipeCell" v-bind="clickWithoutSwipe">
    <van-cell>
      <template #title>
        <div class="list-item-container">
          <div class="first_column flex-center flex-column">
            <app-icon :icon="icon ?? TablerIconConstants.account" :size="32"  :badge="accountBadge" />
            <!--            <span class="badge2"> {{ currencySymbol }}</span>-->
          </div>

          <div class="separator"></div>

          <div class="second_column flex-1">
            <div v-if="displayName" class="flex-center-vertical gap-1">
              <span class="title flex-1"> {{ displayName }}</span>
            </div>

            <div class="subtitle display-flex flex-wrap gap-2">
              <span class="tag-gray list-item-subtitle" v-if="accountType">{{ $t('account_page.account_type') }}: {{ accountType }}</span>
              <span class="tag-gray list-item-subtitle" v-if="accountRole">{{ $t('account_page.account_role') }}: {{ accountRole }}</span>
            </div>

            <div class="display-flex">
              <span class="tag-gray list-item-subtitle mt-5">{{ $t('account_page.balance') }}: {{ accountBalance }}</span>
            </div>
          </div>

        </div>
      </template>
    </van-cell>

    <template #right>
      <van-button class="delete-button" square type="danger" text="Delete" @click="onDelete" />
    </template>
  </van-swipe-cell>
</template>

<script setup>
import _, { get } from 'lodash'
import { useDataStore } from '~/stores/dataStore'
import { useClickWithoutSwipe } from '~/composables/useClickWithoutSwipe'
import TablerIconConstants from '~/constants/TablerIconConstants'
import Account from '~/models/Account.js'

const props = defineProps({
  value: Object,
})

const emit = defineEmits(['onEdit', 'onDelete'])

const dataStore = useDataStore()

const displayName = computed(() => _.get(props.value, 'attributes.name', ' - '))

const accountType = computed(() => _.get(props.value, 'attributes.type.name', ' - '))
const accountRole = computed(() => _.get(props.value, 'attributes.account_role.name'))
const currencySymbol = computed(() => _.get(props.value, 'attributes.currency_code'))
const accountBalance = computed(() => Account.getBalanceWithCurrency(props.value))
const accountBadge = computed(() => Account.getBadge(props.value))
const icon = computed(() => Account.getIcon(props.value))

const onEdit = async (e) => {
  emit('onEdit', props.value)
}

const onDelete = async () => {
  emit('onDelete', props.value)
}

const swipeCell = ref(null)
const clickWithoutSwipe = useClickWithoutSwipe({ swipeCell: swipeCell, onClick: onEdit })
</script>

<style></style>
