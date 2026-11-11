<template>
  <app-sheet v-model:show="showDropdown" :title="title">
    <app-form :id="formName" :name="formName" @submit="onSave">
      <div class="mx-form">
        <app-field v-model="name" name="name" :label="$t('name')" :rules="[rule.required()]" required />
      </div>
    </app-form>
    <app-button-form-delete v-if="itemId" class="m-2" @click="onDelete" />

    <template #footer>
      <button type="button" class="mx-btn out" @click="onHide">{{ $t('cancel') }}</button>
      <button type="submit" class="mx-btn pri" :form="formName">{{ itemId ? $t('save') : $t('kit.create') }}</button>
    </template>
  </app-sheet>
</template>

<script setup>
import { cloneDeep, get } from 'lodash-es'
import { rule } from '~/core/utils/ValidationUtils.js'
import Profile from '~/core/models/Profile.js'
import { useForm, useFormEvent } from '~/core/composables/useForm.js'
import { generateChildren } from '~/core/utils/VueUtils.js'

// Add / edit profile sheet (design: MX-Profiles). Opened by the profiles sheet through onShow(profile | null).
const emits = defineEmits(['saved'])
const profileStore = useProfileStore()

const showDropdown = defineModel('showDropdown', { type: Boolean, default: false })

const resetFields = () => {
  name.value = ''
}

const onEvent = (event, payload) => {
  // When creating a new Profile auto-select it
  if (event === useFormEvent.postSave) {
    const newProfileId = get(payload, 'data.data.id')
    if (newProfileId) {
      profileStore.profileActiveId = newProfileId
    }
  }
  if (event === useFormEvent.postDelete) {
    onHide()
  }
  profileStore.getProfiles()
}

const { itemId, item, saveItem, onDelete, formName } = useForm({
  model: new Profile(),
  resetFields,
  onEvent,
  shouldFetchOnMount: false,
})

const { name } = generateChildren(item, [{ computed: 'name', parentKey: 'name' }])

const onSave = async () => {
  emits('saved', item.value)
  await saveItem()
  onHide()
}

const onHide = () => {
  showDropdown.value = false
}

const onShow = (profile) => {
  item.value = cloneDeep(profile) ?? new Profile().getEmpty()
  showDropdown.value = true
}

const { t } = useI18n()
const title = computed(() => (itemId.value ? t('profile_page.title_edit') : t('profile_page.title_add')))

defineExpose({ onShow, onHide })
</script>
