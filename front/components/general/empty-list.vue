<template>
  <div class="position-absolute-100 no-edge-top no-edge-left flex-center w-100 pointer-events-none">
    <div class="display-flex flex-column align-items-center text-center p-20 max-width-420 pointer-events-auto">
      <img :src="EmptyIllustrationHalf" :srcset="`${EmptyIllustrationHalf} 1x, ${EmptyIllustration} 2x`" class="img-fluid mb-24 md-width-200 md-mb-32" width="160" alt="Empty state" />
      <h3 class="m-0 mb-8 text-size-16 md-text-size-20 font-weight-600">{{ title || $t('general.list_empty') }}</h3>
      <p class="m-0 mb-24 text-size-13 md-text-size-15 font-weight-400 line-height-15">
        {{ subtitle || $t('general.list_empty_subtitle') }}
      </p>

      <div v-if="$slots.action" class="mt-8 md-mt-16">
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

