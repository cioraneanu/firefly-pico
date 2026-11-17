<template>
  <header class="mx-top">
    <button v-if="backRoute" type="button" class="mx-ib" :aria-label="$t('back')" @click="onBack">
      <app-icon :icon="IconArrowLeft" :size="20" :stroke="2" />
    </button>
    <div class="mx-top__t" :style="backRoute ? null : 'padding-left: 4px'">
      <slot name="title">
        <h1>{{ title }}</h1>
        <p v-if="hasSubtitle">{{ subtitle }}</p>
      </slot>
    </div>
    <div class="mx-top__a">
      <slot name="right" />
    </div>
  </header>
</template>

<script setup>
import { IconArrowLeft } from '@tabler/icons-vue'
import { useToolbar } from '~/mobile/composables/useToolbar'

const { title, subtitle, onBack, backRoute } = useToolbar()

const hasSubtitle = computed(() => !isStringEmpty(subtitle.value))
</script>
