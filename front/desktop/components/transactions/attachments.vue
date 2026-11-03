<template>
  <div class="flex flex-col gap-1.5">
    <div v-for="attachment in list" :key="attachment.id" class="flex h-9 items-center gap-2 rounded-lg border border-line pl-2.5 pr-1">
      <icon-paperclip :size="16" class="text-dim" />
      <button type="button" class="flex-1 cursor-pointer truncate text-left hover:underline" @click="open(attachment)">{{ attachment.attributes.title ?? attachment.attributes.filename }}</button>
      <d-button variant="ghost" size="icon-sm" :icon="IconTrash" class="text-dim" :aria-label="$t('delete')" @click="onRemove(attachment)" />
    </div>
    <label class="w-fit">
      <input type="file" class="sr-only" @change="upload($event.target.files)" />
      <span class="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-line px-2.5 text-[13px] font-medium hover:bg-soft">
        <icon-loader-2 v-if="isLoading" :size="14" class="d-spin" />
        <icon-upload v-else :size="14" />
        {{ $t('desktop.add_file') }}
      </span>
    </label>
  </div>
</template>

<script setup>
import { IconLoader2, IconPaperclip, IconTrash, IconUpload } from '@tabler/icons-vue'

const props = defineProps({ transaction: Object })
const { list, isLoading, upload, open, remove } = useAttachments(() => props.transaction)

const onRemove = async (attachment) => (await UIUtils.showDeleteConfirmation('Delete confirmation', 'Are you sure you want to delete this?')) && remove(attachment)
</script>
