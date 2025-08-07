<template>
  <div class="flex-center flex-column p-2 transaction-attachment" v-bind="tapBinding">
    <icon-photo :size="30" :stroke="1.4" />
    <div class="text-size-12">{{ displayName }}</div>
  </div>
</template>

<script setup>
import { IconPhoto } from '@tabler/icons-vue'

import { get, head } from 'lodash'
import { trimString } from '~/utils/StringUtils.js'
import { downloadFileFromUrl, showImageFromUrl } from '~/utils/AttachmentUtils.js'
import { onLongPress } from '@vueuse/core'
import { useTap, useTapEvent } from '~/composables/useTap.js'
import { useActionSheet } from '~/composables/useActionSheet.js'
import AttachmentRepository from '~/repository/AttachmentRepository.js'

const props = defineProps({
  value: {},
})

const emits = defineEmits(['result', 'isLoading'])

const displayName = computed(() => trimString(title.value ?? filename.value).toLowerCase())
const title = computed(() => get(props.value, 'attributes.title'))
const filename = computed(() => get(props.value, 'attributes.filename'))
const downloadUrl = computed(() => get(props.value, 'attributes.download_url'))
const isImage = computed(() => (get(props.value, 'attributes.mime') ?? '').startsWith('image/'))

const { t } = useI18n()

const tapBinding = useTap(async (event) => {
  switch (event) {
    case useTapEvent.single:
      emits('isLoading', true)
      try {
        isImage.value ? await showImageFromUrl(downloadUrl.value) : await downloadFileFromUrl(downloadUrl.value, filename.value)
      } catch {}
      emits('isLoading', false)
      break
    case useTapEvent.double:
    case useTapEvent.long:
      useActionSheet().show([
        {
          name: t('delete'),
          callback: async () => {
            await new AttachmentRepository().delete(props.value?.id)
            emits('result')
          },
        },
      ])
      break
  }
})
</script>
