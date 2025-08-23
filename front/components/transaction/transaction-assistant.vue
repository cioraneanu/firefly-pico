<template>
  <div class="vant-card flex-column mt-5">
    <div class="vant-card-title flex-center-vertical gap-1">
      {{ $t('transaction.assistant') }}
      <app-tutorial :title="$t('transaction.assistant_tutorial_title')" :body="$t('transaction.assistant_tutorial_body')" />

      <div class="flex-1" />
      <currency-dropdown class="text-size-12" v-model="profileStore.assistantCurrency" :is-clearable="true" />
    </div>
    <div class="text-size-12 text-muted mb-5">{{ $t('transaction.assistant_format') }}</div>

    <div class="display-flex flex-column">
      <div class="flex-center-vertical gap-2">
        <app-field
          ref="assistantTextField"
          class="van-cell-no-padding compact flex-1"
          v-model="assistantText"
          label=""
          :placeholder="`${$t('transaction.assistant')} ...`"
          rows="1"
          autosize
          :clearable="true"
        />
      </div>

      <template v-if="foundTag || foundTemplate || hasAmount">
        <!--        <van-icon name="arrow-down" class="w-100 text-center p-10"/>-->
        <div class="display-flex flex-center-vertical gap-2 p-5 mt-10 text-size-12 flex-wrap" style="border: 1px dashed black; border-radius: 5px">
          <template v-if="foundTemplate">
            <van-tag round class="assistant-tag" size="medium" type="primary">
              <span>{{ $t('template') }}</span>
              <span>|</span>
              {{ foundTemplateDisplayName }}
            </van-tag>
          </template>

          <template v-if="foundTag">
            <van-tag round class="assistant-tag" size="medium" type="primary">
              <span>{{ $t('tag') }}</span>
              <span>|</span>
              {{ Tag.getDisplayNameEllipsized(foundTag) }}
            </van-tag>
          </template>

          <template v-if="foundCategory">
            <van-tag round class="assistant-tag" size="medium" type="primary">
              <span>{{ $t('category') }}:</span>
              <span>|</span>
              {{ Category.getDisplayName(foundCategory) }}
            </van-tag>
          </template>

          <template v-if="foundAmount">
            <van-tag class="assistant-tag" round size="medium" type="primary">
              <span>{{ $t('amount') }}</span>
              <span>|</span>
              <span>{{ foundAmount }}</span>
            </van-tag>
          </template>

          <template v-if="foundDescription">
            <van-tag class="assistant-tag" round size="medium" type="primary">
              <span>{{ $t('description') }}</span>
              <span>|</span>
              <span>{{ ellipsizeText(foundDescription, 20) }}</span>
            </van-tag>
          </template>

          <template v-if="isTodo">
            <div class="assistant-tag tag-todo">
              <span>{{ $t('todo') }}</span>
            </div>
          </template>
        </div>
      </template>
    </div>

    <transaction-template-popup v-model:show="show" v-model="foundTemplate" />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useDataStore } from '~/stores/dataStore'
import { debounce } from 'lodash/function'
import Tag from '~/models/Tag'
import AppTutorial from '~/components/ui-kit/app-tutorial.vue'
import Category from '~/models/Category.js'
import { ellipsizeText } from '~/utils/Utils.js'
import { useFuzzySearchResource } from '~/composables/useFuzzySearch.js'

const props = defineProps({})

const dataStore = useDataStore()
const profileStore = useProfileStore()

const emit = defineEmits(['change'])
const show = ref(false)

const assistantText = defineModel()
const assistantTextField = ref(null)

const foundCategory = ref(null)
const foundTag = ref(null)
const foundTemplate = ref(null)
const foundTemplateDisplayName = ref(null) // String showing either template name or the matched extra name
const foundAmount = ref(null)
const foundDescription = ref(null)
const isTodo = ref(false)

const hasAmount = computed(() => {
  return foundAmount.value && foundAmount.value > 0
})

const fuzzySearch = useFuzzySearch()

onMounted(() => {})



const autoFocusField = () => {
  // const textArea = assistantTextField.value.querySelector('textarea')
  // assistantTextField.value.prompt()
}
const processAssistantText = () => {
  let text = assistantText.value
  if (!text || text.length === 0) {
    foundAmount.value = '0'
    foundTemplate.value = null
    foundCategory.value = null
    foundTag.value = null
    // onSubmit()
    return
  }

  text = RomanianLanguageUtils.fixBadWordNumbers(text)
  text = text.replace(',', '.')

  isTodo.value = profileStore.assistantTodoTagMatcher && text.endsWith(profileStore.assistantTodoTagMatcher)
  text = isTodo.value ? text.slice(0, text.length - profileStore.assistantTodoTagMatcher.length) : text

  // 3 groups: <template> <amount> <description>
  const regex = /^(\D+)?(?:\s*(\d[\.\d\s\+\-\*\/]*))?(?:\s+(.*))?$/
  const match = text.match(regex)

  let searchWords = match[1] || ''

  let numerical = match[2]
  let { wasSuccessful, value } = evalMath(numerical)
  foundAmount.value = numerical && wasSuccessful ? value.toString() : null

  foundDescription.value = match[3] || ''

  let bestGuess = fuzzySearch.search(searchWords)


  if (bestGuess) {
    foundTemplate.value = bestGuess.type === useFuzzySearchResource.template.type ? bestGuess.item : null
    foundTemplateDisplayName.value = foundTemplate.value ? bestGuess.match : null

    foundTag.value = bestGuess.type === useFuzzySearchResource.tag.type ? bestGuess.item : null
    foundCategory.value = bestGuess.type === useFuzzySearchResource.category.type ? bestGuess.item : null
  }
}

watch(assistantText, (newValue) => {
  processReceivedTextDebounce()
})

const processReceivedTextDebounce = debounce(processAssistantText, 200)


const onClear = () => {
  assistantText.value = ''
  foundAmount.value = null
  foundTemplate.value = null
  foundCategory.value = null
  foundTag.value = null
  foundDescription.value = null
}

const onShow = () => {
  show.value = true
}

watch(
  [foundTemplate, foundTag, foundCategory, foundAmount, foundDescription, isTodo, () => profileStore.assistantCurrency, () => profileStore.profileActiveId],
  ([newTemplate, newTag, newCategory, newAmount, newDescription, newIsTodo, newAssistantCurrency, _]) => {
    emit('change', {
      transactionTemplate: newTemplate,
      amount: newAmount,
      tag: newTag,
      category: newCategory,
      description: newDescription,
      isTodo: newIsTodo,
      assistantCurrency: newAssistantCurrency,
    })
  },
)

// -----
</script>

<style scoped></style>
