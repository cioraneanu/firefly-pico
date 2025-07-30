<template>
  <div class="flex-center bg-success" style="width: 50px; height: 50px">
    {{ letter }}
  </div>
</template>


<script setup>
import { get, head } from 'lodash'

const props = defineProps({
  value: {}
})


const letter = computed(() => head(get(props.value, 'attributes.filename')))

</script>