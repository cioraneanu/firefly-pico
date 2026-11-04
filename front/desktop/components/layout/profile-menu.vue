<template>
  <button ref="trigger" type="button" class="flex h-12 w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-soft" @click="open = !open">
    <d-tile class="text-xs font-semibold">{{ initials }}</d-tile>
    <span class="grid min-w-0 flex-1 leading-tight">
      <b class="truncate text-sm font-medium">{{ profileStore.activeProfile?.name ?? $t('profile') }}</b>
      <span class="truncate text-xs text-dim">{{ $t('profile_page.info') }}</span>
    </span>
    <icon-selector :size="16" class="text-dim" />
  </button>

  <d-popover v-model:open="open" :anchor="trigger" width="15rem">
    <p class="px-1.5 py-1 text-xs font-medium text-dim">{{ $t('profile_page.title') }}</p>
    <button
      v-for="profile in profileStore.profileList"
      :key="profile.id"
      type="button"
      class="relative flex w-full cursor-default items-center gap-2 rounded-md py-1 pl-1.5 pr-8 text-left hover:bg-soft"
      @click="select(profile)"
    >
      <icon-user :size="16" class="text-dim" />
      <span class="truncate">{{ profile.name ?? $t('not_set') }}</span>
      <icon-check v-if="profile.id === profileStore.profileActiveId" :size="16" class="absolute right-2" />
    </button>
    <div class="-mx-1 my-1 h-px bg-line" />
    <button type="button" class="flex w-full cursor-default items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-soft" @click="edit(null)">
      <icon-plus :size="16" class="text-dim" />
      {{ $t('profile_page.title_add') }}
    </button>
    <button
      v-if="profileStore.activeProfile"
      type="button"
      class="flex w-full cursor-default items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-soft"
      @click="edit(profileStore.activeProfile)"
    >
      <icon-pencil :size="16" class="text-dim" />
      {{ $t('profile_page.title_edit') }}
    </button>
  </d-popover>

  <d-dialog :open="dialog" :title="itemId ? $t('profile_page.title_edit') : $t('profile_page.title_add')" :description="$t('profile_page.info')" size="sm" @close="dialog = false">
    <d-form :id="formName" @submit="saveItem">
      <d-field :label="$t('name')" :rules="[rule.required()]" :value="item.name">
        <d-input v-model="item.name" autofocus />
      </d-field>
    </d-form>
    <template #footer>
      <d-button v-if="itemId" variant="danger" :icon="IconTrash" class="mr-auto" @click="onDelete">{{ $t('delete') }}</d-button>
      <d-button @click="dialog = false">{{ $t('cancel') }}</d-button>
      <d-button variant="primary" type="submit" :form="formName">{{ $t('save') }}</d-button>
    </template>
  </d-dialog>
</template>

<script setup>
import { IconCheck, IconPencil, IconPlus, IconSelector, IconTrash, IconUser } from '@tabler/icons-vue'
import { cloneDeep, get } from 'lodash-es'
import Profile from '~/core/models/Profile'
import { rule } from '~/core/utils/ValidationUtils'

const profileStore = useProfileStore()
const trigger = ref(null)
const open = ref(false)
const dialog = ref(false)

const initials = computed(() => (profileStore.activeProfile?.name ?? 'P').slice(0, 2).toUpperCase())

const onEvent = (event, payload) => {
  const id = get(payload, 'data.data.id')
  if (event === useFormEvent.postSave && id) profileStore.profileActiveId = id
  profileStore.getProfiles()
  dialog.value = false
}

const { itemId, item, saveItem, onDelete, formName } = useForm({ model: new Profile(), onEvent, shouldFetchOnMount: false })

const select = (profile) => {
  profileStore.setProfile(profile)
  open.value = false
}

const edit = (profile) => {
  item.value = cloneDeep(profile) ?? new Profile().getEmpty()
  open.value = false
  dialog.value = true
}
</script>
