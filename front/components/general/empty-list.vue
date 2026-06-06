<template>
  <div class="empty-state-wrapper">
    <div class="empty-state">
      <img :src="EmptyIllustrationHalf" :srcset="`${EmptyIllustrationHalf} 1x, ${EmptyIllustration} 2x`" class="empty-illustration" alt="Empty state" />
      <h3 class="empty-title">{{ title || $t('general.list_empty') }}</h3>
      <p class="empty-subtitle">
        {{ subtitle || $t('general.list_empty_subtitle') }}
      </p>

      <div v-if="$slots.action" class="empty-action">
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

<style scoped>
.empty-state-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 420px;
  padding: 20px;
  pointer-events: auto;
}

.empty-illustration {
  width: 160px;
  max-width: 100%;
  margin-bottom: 24px;
}

.empty-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--van-text-color, #323233);
}

.empty-subtitle {
  margin: 0 0 24px 0;
  font-size: 13px;
  font-weight: 400;
  //color: var(--van-text-color-2, #969799);
  line-height: 1.5;
}

.empty-action {
  margin-top: 8px;
}

/* Adjustments for desktop */
@media (min-width: 768px) {
  .empty-illustration {
    width: 200px;
    margin-bottom: 32px;
  }

  .empty-title {
    font-size: 20px;
  }

  .empty-subtitle {
    font-size: 15px;
  }

  .empty-action {
    margin-top: 16px;
  }
}
</style>
