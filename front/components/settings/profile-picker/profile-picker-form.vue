<template>
  <div>
    <van-popup v-model:show="showDropdown" round position="bottom" style="padding-top: 4px; padding-bottom: 80px">
      <div ref="popupRef" class="h-100 display-flex flex-column qqq">
        <div class="van-popup-title flex-center-vertical px-4">
          <div class="flex-1">{{ title }}</div>
          <!--        <van-button size="small" @click="onSave">Close</van-button>-->
        </div>

        <van-cell-group inset>
          <app-field v-model="item.name" :label="$t('name')" :rules="[rule.required()]" required />
        </van-cell-group>

        <app-button-form-delete class="mx-3 mt-1" style="width: auto" v-if="itemId" @click="onDelete" />
        <app-button-form-save bottom=" - var(--van-tabbar-height) + 20px" @click="onSave" />
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { IconPlus } from '@tabler/icons-vue'
import { rule } from '~/utils/ValidationUtils.js'
import ProfileRepository from '~/repository/ProfileRepository.js'
import Profile from '~/models/Profile.js'
import _, { cloneDeep, get } from 'lodash'
import { ref } from 'vue'
import { useDataStore } from '~/stores/dataStore.js'
import CategoryTransformer from '~/transformers/CategoryTransformer.js'
import { useForm, useFormEvent } from '~/composables/useForm.js'
import RouteConstants from '~/constants/RouteConstants.js'
import Category from '~/models/Category.js'
import { generateChildren } from '~/utils/VueUtils.js'
import BudgetTransformer from '~/transformers/BudgetTransformer.js'

const props = defineProps({})
const emits = defineEmits(['saved'])
const profileStore = useProfileStore()

const showDropdown = defineModel('showDropdown', false)

const form = ref(null)

const resetFields = () => {
  name.value = ''
}

const onEvent = (event, payload) => {

  // When creating a new Profile auto-select it
  if (event === useFormEvent.postSave) {
    let newProfileId = get(payload, 'data.data.id')
    newProfileId ? profileStore.profileActiveId = newProfileId : null
  }
  profileStore.getProfiles()
}

let { itemId, item, isEmpty, addButtonText, isLoading, onClickBack, saveItem, onDelete, onNew, onValidationError, formName } = useForm({
  form: form,
  model: new Profile(),
  resetFields,
  onEvent,
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
  itemId.value = item.value.id
  showDropdown.value = true
}

const { t } = useI18n()
const title = computed(() => (itemId.value ? t('profile_page.title_edit') : t('profile_page.title_add')))

defineExpose({ onShow, onHide })
</script>
