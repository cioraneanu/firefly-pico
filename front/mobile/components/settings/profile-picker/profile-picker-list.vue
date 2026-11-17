<template>
  <app-sheet v-model:show="show" :title="$t('profile_page.title')" :description="$t('profile_page.info')">
    <template #header-right>
      <button type="button" class="mx-ib sm" :aria-label="$t('kit.refresh')" @click="onRefresh">
        <span v-if="isLoading" class="mx-spin" />
        <app-icon v-else :icon="IconRefresh" :size="16" :stroke="2" />
      </button>
    </template>

    <div v-for="profile in profileStore.profileList" :key="profile.id" class="mx-row mid p-0 min-h-0 shadow-none">
      <button type="button" class="mx-opt" :class="{ on: isActive(profile) }" :aria-pressed="isActive(profile)" @click="onPick(profile)">
        <span class="ic av">{{ getInitial(profile) }}</span>
        <span class="lb flex flex-col whitespace-normal">
          <span>{{ profile.name ?? $t('not_set') }}</span>
          <span v-if="isActive(profile)" class="mt">{{ $t('active') }}</span>
        </span>
        <span class="ok"><app-icon :icon="IconCheck" :size="18" :stroke="2" /></span>
      </button>
      <button type="button" class="mx-ib sm" :aria-label="$t('profile_page.title_edit')" @click="profileForm?.onShow(profile)">
        <app-icon :icon="IconPencil" :size="16" :stroke="2" />
      </button>
    </div>

    <template #footer>
      <app-tutorial v-slot="{ open }" :title="$t('profile_page.title')" :body="$t('profile_page.tutorial_body')">
        <button type="button" class="mx-btn out" @click="open">
          <app-icon :icon="IconHelpCircle" :size="16" :stroke="2" />
          <span>{{ $t('kit.what_is_profile') }}</span>
        </button>
      </app-tutorial>
      <button type="button" class="mx-btn pri" @click="profileForm?.onShow(null)">
        <app-icon :icon="IconPlus" :size="16" :stroke="2" />
        <span>{{ $t('profile_page.title_add') }}</span>
      </button>
    </template>
  </app-sheet>

  <profile-picker-form ref="profileForm" />
</template>

<script setup>
import { IconCheck, IconHelpCircle, IconPencil, IconPlus, IconRefresh } from '@tabler/icons-vue'
import UIUtils from '~/core/utils/UIUtils'
import ProfilePickerForm from '~/mobile/components/settings/profile-picker/profile-picker-form.vue'

// Profiles sheet (design: MX-Profiles): tap a profile to switch to it, the pencil edits it.
const show = defineModel('show', { type: Boolean, default: false })

const profileStore = useProfileStore()
const { t } = useI18n()
const profileForm = ref(null)

const isActive = (profile) => profileStore.profileActiveId === profile.id
const getInitial = (profile) => (profile.name ?? '?').charAt(0).toUpperCase()

const onPick = (profile) => {
  if (!isActive(profile)) {
    profileStore.setProfile(profile)
    UIUtils.showToastSuccess(t('kit.profile_switched', { name: profile.name ?? t('not_set') }))
  }
  show.value = false
}

const isLoading = ref(false)
const onRefresh = async () => {
  isLoading.value = true
  await profileStore.getProfiles()
  isLoading.value = false
}
</script>
