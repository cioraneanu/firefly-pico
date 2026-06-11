<template>
  <transition :name="transitionName">
    <div v-if="loadingStore.isLoadingDelayed" class="app-loading-background">
      <div class="app-loading flex-column flex-center">
        <icon-rotate :size="30" :stroke="1.4" class="animate-rotate-infinite" />
        <div class="text-size-16">{{ loadingStore.loadingMessage }}</div>

        <!--        <div v-if="loadingStore.activeRequests.length > 0" class="text-size-12 text-muted mt-2">{{ loadingStore.activeRequests.length }} {{ $t('requests_remaining') }}</div>-->

        <!--        <van-button v-show="isCancelVisible" @click="loadingStore.cancelActiveRequests()" class="mt-4" size="small" type="danger">-->
        <!--          {{ $t('stop') }}-->
        <!--        </van-button>-->
      </div>
    </div>
  </transition>
</template>

<script setup>
import { IconRotate } from '@tabler/icons-vue'
import { useLoadingStore } from '~/stores/loadingStore'
import { watchDebounced } from '@vueuse/core'
import { debounce } from 'lodash-es'
import { watch } from 'vue'

const profileStore = useProfileStore()
const transitionName = computed(() => (profileStore.showAnimations ? 'fade' : ''))

const loadingStore = useLoadingStore()
const isCancelVisible = ref(false)

const setIsCancelVisible = debounce(() => (isCancelVisible.value = true), 1000)
watch(
  () => loadingStore.isLoadingDelayed,
  (newValue) => (newValue ? setIsCancelVisible() : ((isCancelVisible.value = true), setIsCancelVisible.cancel())),
)
</script>
