<template>
  <div class="flex items-center justify-center flex-col p-2 transaction-attachment" v-bind="tapBinding">
    <icon-photo :size="30" :stroke="1.4" />
    <div class="text-12">{{ displayName }}</div>
  </div>
</template>

<script setup>
import { IconPhoto } from '@tabler/icons-vue'

import { get } from 'lodash-es'
import { trimString } from '~/core/utils/StringUtils.js'
import { downloadFileFromUrl, showImageFromUrl } from '~/core/utils/AttachmentUtils.js'
import { useTap, useTapEvent } from '~/mobile/composables/useTap.js'
import { useActionSheet } from '~/mobile/composables/useActionSheet.js'
import AttachmentRepository from '~/core/repository/AttachmentRepository.js'

const props = defineProps({
  value: {
    type: Object,
    default: () => ({}),
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
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
        if (isImage.value) {
          await showImageFromUrl(downloadUrl.value)
        } else {
          await downloadFileFromUrl(downloadUrl.value, filename.value)
        }
      } catch {
        // Existing attachment downloads fail silently; always clear the loading state below.
      }
      emits('isLoading', false)
      break
    case useTapEvent.double:
    case useTapEvent.long:
      if (props.readOnly) {
        return
      }
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
