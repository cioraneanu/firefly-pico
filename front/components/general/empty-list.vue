<template>
  <div class="absolute w-full h-full top-0 left-0 flex items-center justify-center pointer-events-none">
    <div class="flex flex-col items-center text-center p-5 max-w-[420px] pointer-events-auto">
      <img :src="EmptyIllustrationHalf" :srcset="`${EmptyIllustrationHalf} 1x, ${EmptyIllustration} 2x`" class="max-w-full h-auto mb-6 md:w-50 md:mb-8" width="160" alt="Empty state" />
      <h3 class="m-0 mb-2 text-16 md:text-20 font-semibold">{{ title || $t('general.list_empty') }}</h3>
      <p class="m-0 mb-6 text-13 md:text-15 font-normal leading-normal">
        {{ subtitle || $t('general.list_empty_subtitle') }}
      </p>

      <div v-if="$slots.action" class="mt-2 md:mt-4">
        <slot name="action" />
      </div>
    </div>
  </div>
</template>

<script setup>
import EmptyIllustration from '~/assets/images/empty-folder.png'
import EmptyIllustrationHalf from '~/assets/images/empty-folder-half.png'

defineProps({
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
})
</script>

