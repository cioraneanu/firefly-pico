<template>
  <van-popup v-model:show="showDropdown" round position="bottom" style="padding-top: 4px; padding-bottom: 80px">
    <div ref="popupRef" class="h-100 display-flex flex-column qqq">
      <div class="van-popup-title flex-center-vertical px-4">
        <div class="flex-1">Create new profile</div>
        <!--        <van-button size="small" @click="onSave">Close</van-button>-->
      </div>

      <van-cell-group inset>
        <app-field v-model="profileName" :label="$t('name')" :rules="[rule.required()]" required />
      </van-cell-group>

      <app-button-form-save bottom=" - var(--van-tabbar-height) + 20px" @click="onSave" />
    </div>
  </van-popup>
</template>

<script setup>
import { IconPlus } from '@tabler/icons-vue'
import { rule } from '~/utils/ValidationUtils.js'
import SettingsTokenField from '~/components/settings/settings-token-field.vue'
import ProfileRepository from '~/repository/ProfileRepository.js'

const props = defineProps({})
const profileStore = useProfileStore()

const showDropdown = defineModel('showDropdown', false)
const profileName = ref('')

const onSave = async () => {
  let body = {
    name: profileName.value,
    settings: profileStore.getProfileSettings(),
  }
  const response = await new ProfileRepository().insert(body)
  await profileStore.getProfiles()
  onHideDropdown()
}

const onHideDropdown = () => {
  showDropdown.value = false
}
</script>
