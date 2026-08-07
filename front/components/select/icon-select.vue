<template>
  <app-select
    v-model="modelValue"
    v-model:show-dropdown="showDropdown"
    v-model:search="search"
    :label="label ?? $t('icon')"
    :popup-title="$t('icon_select')"
    :list="filteredList"
    :columns="6"
    :get-display-value="getDisplayValue"
    v-bind="dynamicAttrs"
  >
    <template #left-icon>
      <app-icon :icon="TablerIconConstants.fieldIcon" :size="20" />
    </template>

    <template #input>
      <div v-if="!modelValue" class="text-muted"> {{ $t('icon_empty') }} </div>
      <app-icon v-else :icon="modelValue.icon" style="width: 25px"/>
    </template>

    <template #item="{ item }">
      <div class="flex-center flex-column mt-5 text-size-12">
        <app-icon :icon="item.icon" style="width: 30px"/>
        <div class="app-icon-item"/>
      </div>
    </template>
  </app-select>
</template>

<script setup>
import { useCategoryStore } from '~/stores/categoryStore'
import { useFormAttributes } from '~/composables/useFormAttributes'
import Category from '~/models/Category.js'
import { avatarListIcons, duoToneListIcons, fluentListIcons } from '~/constants/SvgConstants.js'
import TablerIconConstants from '~/constants/TablerIconConstants.js'

const categoryStore = useCategoryStore()
const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const props = defineProps({
  label: {
    type: String,
  },
  list: {},
})

const modelValue = defineModel()
const showDropdown = ref(false)
const search = ref('')

const list = computed(() => {
  if (props.list) {
    return props.list
  }

  return [
    ...duoToneListIcons,
    ...fluentListIcons,
    ...avatarListIcons,
    // ...flatColorListIcons,
  ]
})

// let list = ref(
//     props.list ??
//     [
//       ...duoToneListIcons,
//       ...fluentListIcons,
//       ...avatarListIcons,
//       // ...flatColorListIcons,c
//     ])

const filteredList = computed(() => {
  if (search.value.length === 0) {
    return list.value
  }
  return list.value.filter((icon) => {
    return icon.name.toLowerCase().indexOf(search.value.toLowerCase()) !== -1
  })
})

// ------ Methods ------

// onMounted(async () => {
//   list.value = appSelectIcons
// })

const onSelectCell = (value) => {
  modelValue.value = value
  showDropdown.value = false
}

const getDisplayValue = (value) => {
  return Category.getDisplayName(value)
}

const isLoading = ref(false)
const onRefresh = async () => {
  isLoading.value = true
  await categoryStore.fetchCategories()
  isLoading.value = false
}
</script>

