import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import { endOfMonth, startOfMonth } from 'date-fns'
import SubscriptionRepository from '~/core/repository/SubscriptionRepository.js'
import SubscriptionTransformer from '~/core/transformers/SubscriptionTransformer.js'
import DateUtils from '~/core/utils/DateUtils'
import { useProfileStore } from '~/core/stores/profileStore'

export const useSubscriptionStore = defineStore('subscription', () => {
  const subscriptionList = useLocalStorage('subscriptionList', [])
  const isLoadingSubscriptions = ref(false)

  const subscriptionDictionary = computed(() => {
    return keyBy(subscriptionList.value, 'id')
  })

  async function fetchSubscriptions() {
    const profileStore = useProfileStore()
    if (!profileStore.subscriptionsEnabled) {
      subscriptionList.value = []
      return
    }
    isLoadingSubscriptions.value = true

    // With a date range Firefly fills in this month's expected and paid dates
    const filters = [
      { field: 'start', value: DateUtils.dateToString(startOfMonth(new Date())) },
      { field: 'end', value: DateUtils.dateToString(endOfMonth(new Date())) },
    ]
    const list = await new SubscriptionRepository().getAllWithMerge({ filters })
    subscriptionList.value = SubscriptionTransformer.transformFromApiList(list)

    isLoadingSubscriptions.value = false
  }

  return {
    subscriptionList,
    isLoadingSubscriptions,
    subscriptionDictionary,
    fetchSubscriptions,
  }
})
