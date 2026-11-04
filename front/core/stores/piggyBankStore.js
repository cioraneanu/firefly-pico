import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { keyBy } from 'lodash-es'
import { useLocalStorage } from '@vueuse/core'
import PiggyBankRepository from '~/core/repository/PiggyBankRepository.js'
import PiggyBankTransformer from '~/core/transformers/PiggyBankTransformer.js'
import { useProfileStore } from '~/core/stores/profileStore'

export const usePiggyBankStore = defineStore('piggyBank', () => {
  const piggyBankList = useLocalStorage('piggyBankList', [])
  const isLoadingPiggyBanks = ref(false)

  const piggyBankDictionary = computed(() => {
    return keyBy(piggyBankList.value, 'id')
  })

  async function fetchPiggyBanks() {
    const profileStore = useProfileStore()
    if (!profileStore.piggyBanksEnabled) {
      piggyBankList.value = []
      return
    }
    isLoadingPiggyBanks.value = true

    const list = await new PiggyBankRepository().getAllWithMerge()
    piggyBankList.value = PiggyBankTransformer.transformFromApiList(list)

    isLoadingPiggyBanks.value = false
  }

  return {
    piggyBankList,
    isLoadingPiggyBanks,
    piggyBankDictionary,
    fetchPiggyBanks,
  }
})
