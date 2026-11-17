<template>
  <app-list-item :deletable="!readOnly" @on-edit="onOpen" @on-delete="onDelete">
    <span class="mx-thumb" :class="{ img: isImage }">
      <app-icon :icon="isImage ? IconPhoto : IconFileText" :size="20" :stroke="2" />
      <span v-if="extension" class="ext">{{ extension }}</span>
    </span>
    <span class="mx-row__m">
      <span class="mx-row__t">{{ displayName }}</span>
      <span v-if="meta" class="mx-row__s">{{ meta }}</span>
    </span>
    <span class="mx-ib sm" aria-hidden="true">
      <app-icon :icon="isImage ? IconEye : IconDownload" :size="16" :stroke="2" />
    </span>
  </app-list-item>
</template>

<script setup>
import { IconDownload, IconEye, IconFileText, IconPhoto } from '@tabler/icons-vue'
import { get } from 'lodash-es'
import { downloadFileFromUrl, showImageFromUrl } from '~/core/utils/AttachmentUtils.js'
import AttachmentRepository from '~/core/repository/AttachmentRepository.js'
import UIUtils from '~/core/utils/UIUtils.js'

// One attachment row (design: MX-Attachments). Tap = preview an image / download a file, swipe left = delete.
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
const { t } = useI18n()

const title = computed(() => get(props.value, 'attributes.title'))
const filename = computed(() => get(props.value, 'attributes.filename'))
const displayName = computed(() => title.value ?? filename.value)
const downloadUrl = computed(() => get(props.value, 'attributes.download_url'))
const isImage = computed(() => (get(props.value, 'attributes.mime') ?? '').startsWith('image/'))
const extension = computed(() => (filename.value?.includes('.') ? filename.value.split('.').pop().toUpperCase().slice(0, 4) : null))

const meta = computed(() => {
  const size = get(props.value, 'attributes.size')
  const sizeLabel = size ? (size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`) : null
  return [title.value && title.value !== filename.value ? filename.value : null, sizeLabel].filter(Boolean).join(' · ')
})

const onOpen = async () => {
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
}

const onDelete = async () => {
  if (props.readOnly || !(await UIUtils.showDeleteConfirmation(t('delete'), t('transaction.attachment_delete_confirm')))) {
    return
  }
  await new AttachmentRepository().delete(props.value?.id)
  emits('result')
}
</script>
