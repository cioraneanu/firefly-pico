<template>
  <div class="profile-picker">
    <div class="profile-picker-container">
      <div class="display-flex font-600 text-size-14">
        <div class="flex-1">Profiles list</div>
        <van-button size="small" class="add-button" @click="onAdd">New</van-button>
      </div>

      <div class="profile-picker-card-list">
        <div v-for="profile in profileStore.profileList" :class="getProfileCardClass(profile)" @click="onSelectProfile(profile)">
          {{ profile.name ?? $t('not_set')}}
        </div>

      </div>

      <profile-picker-create v-model:showDropdown="showDropdown" />
    </div>
  </div>
</template>

<script setup>
import { IconPlus } from '@tabler/icons-vue'

const props = defineProps({})
const profileStore = useProfileStore()

// const profiles = ref([{ name: 'My first profile' }, { name: 'Wow another one' }, { name: 'Third profile' }, { name: 'Third profile' }, { name: 'Third profile' }])

const showDropdown = ref(false)

const onAdd = () => {
  showDropdown.value = true
}

const getProfileCardClass = (profile) => ({
  'profile-picker-card': true,
  'active': profileStore.profileActiveId === profile.id
})


const onSelectProfile = (profile) => {
  profileStore.setProfile(profile)
}


</script>
