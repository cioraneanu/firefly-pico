<template>


  <div class="van-cell-fake">
    <van-field
        class="app-field"
        :label="label"
        v-bind="dynamicAttrs"
        @click="onToggle"
        readonly>

      <template v-if="$slots.label" #label>
        <slot name="label"/>
      </template>

      <template #input>
        <div>
          <van-tag v-if="modelValue" round size="medium" type="primary">Yes</van-tag>
          <van-tag v-else round size="medium" type="primary">No</van-tag>
        </div>
      </template>
    </van-field>
  </div>


</template>


<script setup>

const props = defineProps({
  label: {
    type: String,
    default: 'Is it on?',
  },
})

const modelValue = defineModel()

const attrs = useAttrs()
const { dynamicAttrs } = useFormAttributes(attrs)

const onToggle = () => {
  modelValue.value = !modelValue.value
}


</script>

<style>

</style>