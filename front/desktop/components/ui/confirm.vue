<template>
  <Teleport to="#d-portal">
    <Transition name="d-dialog">
      <div v-if="confirmState" class="fixed inset-0 z-[70] grid place-items-center p-4">
        <div class="absolute inset-0 bg-black/10 backdrop-blur-xs dark:bg-black/50" @click="close(false)" />
        <div role="alertdialog" aria-modal="true" class="d-dialog-panel relative grid w-full max-w-sm gap-4 rounded-xl bg-pop p-4 ring-1 ring-fg/10">
          <div class="flex items-start gap-4">
            <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-danger/10 text-danger"><icon-trash :size="22" /></span>
            <div>
              <h2 class="text-base font-medium">{{ confirmState.title }}</h2>
              <p class="mt-1.5 text-sm text-dim">{{ confirmState.message }}</p>
            </div>
          </div>
          <div class="-mx-4 -mb-4 flex justify-end gap-2 rounded-b-xl border-t border-line bg-soft/50 p-4">
            <d-button @click="close(false)">{{ $t('cancel') }}</d-button>
            <d-button variant="danger" autofocus @click="close(true)">{{ $t('delete') }}</d-button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { IconTrash } from '@tabler/icons-vue'

const { confirmState } = useDesktopUI()

const close = (result) => {
  confirmState.value.resolve(result)
  confirmState.value = null
}

useLayer(
  computed(() => !!confirmState.value),
  () => close(false),
)
</script>
