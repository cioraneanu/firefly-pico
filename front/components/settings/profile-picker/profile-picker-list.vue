<template>
  <div class="profile-picker">
    <van-loading v-if="profileStore.isLoading" />
    <div v-else class="profile-picker-container">
      <div class="flex-center-vertical font-600 text-size-14 gap-2">
        <div class="">{{ $t('profile_page.title') }}</div>
        <app-tutorial :title="$t('profile_page.title')" :body="$t('profile_page.tutorial_body')" />
        <div class="flex-1" />
        <icon-rotate-clockwise :size="22" :stroke="2.0" @click="profileStore.getProfiles()" />
        <van-button size="small" class="add-button" @click="onAdd">{{ $t('new') }}</van-button>
      </div>

      <div class="text-muted text-size-12">{{ $t('profile_page.info') }}</div>
      <div class="profile-picker-card-list">
        <div v-for="profile in profileStore.profileList" :class="getProfileCardClass(profile)" v-bind="tapBinding(profile)">
          {{ profile.name ?? $t('not_set') }}
        </div>
      </div>

      <profile-picker-form ref="profileForm" />
    </div>
  </div>
</template>

<script setup>
import { IconRotateClockwise } from '@tabler/icons-vue'
import ProfilePickerForm from '~/components/settings/profile-picker/profile-picker-form.vue'
import AppTutorial from '~/components/ui-kit/app-tutorial.vue'
import { useTap, useTapEvent } from '~/composables/useTap.js'

const props = defineProps({})
const profileStore = useProfileStore()

const showDropdown = ref(false)
const profileForm = ref(null)

const getProfileCardClass = (profile) => ({
  'profile-picker-card': true,
  active: profileStore.profileActiveId === profile.id,
})


const onAdd = () => {
  profileForm.value?.onShow(null)
}


const tapBinding = (profile) => useTap(async (event) => {
  switch (event) {
    case useTapEvent.single:
      profileStore.setProfile(profile)
      break
    case useTapEvent.long:
    case useTapEvent.double:
      profileForm.value?.onShow(profile)
      break
  }
})

</script>
