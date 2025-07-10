<template>
  <div class="profile-picker">
    <van-loading v-if="profileStore.isLoading" />
    <div v-else class="profile-picker-container">
      <div class="display-flex font-600 text-size-14">
        <div class="flex-1">{{ $t('profile_page.title') }}</div>
        <van-button size="small" class="add-button" @click="onAdd">{{ $t('new') }}</van-button>
      </div>

      <div class="text-muted text-size-12">Quickly switch between different default source account, currency etc. </div>
      <div class="profile-picker-card-list">
        <div v-for="profile in profileStore.profileList" :class="getProfileCardClass(profile)" @click="onClickEvent(profile)">
          {{ profile.name ?? $t('not_set') }}
        </div>
      </div>

      <profile-picker-form ref="profileForm" />
    </div>
  </div>
</template>

<script setup>
import { IconPlus } from '@tabler/icons-vue'
import ProfilePickerForm from '~/components/settings/profile-picker/profile-picker-form.vue'

const props = defineProps({})
const profileStore = useProfileStore()

const showDropdown = ref(false)
const profileForm = ref(null)

const onAdd = () => {
  // showDropdown.value = true
  profileForm.value?.onShow()
}

const getProfileCardClass = (profile) => ({
  'profile-picker-card': true,
  active: profileStore.profileActiveId === profile.id,
})

const clickEvent = useClickEvents()
const onClickEvent = (profile) =>
  clickEvent.handleClick({
    single: () => {
      profileStore.setProfile(profile)
    },
    double: () => {
      profileForm.value?.onShow(profile)
    },
  })
</script>
