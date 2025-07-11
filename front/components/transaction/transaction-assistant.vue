<template>
  <div class="vant-card flex-column mt-5">
    <div class="vant-card-title flex-center-vertical gap-1">
      {{ $t('transaction.assistant') }}
      <app-tutorial :title="$t('transaction.assistant_tutorial_title')" :body="$t('transaction.assistant_tutorial_body')" />

      <div class="flex-1" />
      <currency-dropdown class="text-size-12" v-model="profileStore.assistantCurrency" />
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

        <van-button v-if="assistantText" @click="onClear" size="small" style="height: 40px">Clear</van-button>

        <!--        <van-button @click="onShow" style="height: auto; padding: 0px 12px;">-->
        <!--          <icon-hand-finger :size="15" :stroke-width="1.5"/>-->
        <!--        </van-button>-->
      </div>

      <template v-if="foundTag || foundTemplate || hasAmount">
        <!--        <van-icon name="arrow-down" class="w-100 text-center p-10"/>-->
        <div class="display-flex flex-center-vertical gap-2 p-5 mt-10 text-size-12 flex-wrap" style="border: 1px dashed black; border-radius: 5px">
          <template v-if="foundTemplate">
            <van-tag round class="assistant-tag" size="medium" type="primary">
              <!--              <app-icon :icon="TablerIconConstants.transactionTemplate" color="#fff" class="mr-5" :size="15"/>-->
              <span>{{ $t('template') }}</span>
              <span>|</span>
              {{ TransactionTemplate.getDisplayName(foundTemplate) }}
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
import TransactionTemplate from '~/models/TransactionTemplate'
import { debounce } from 'lodash/function'
import { get, head } from 'lodash'
import Tag from '~/models/Tag'
import Fuse from 'fuse.js'
import AppTutorial from '~/components/ui-kit/app-tutorial.vue'
import { TUTORIAL_CONSTANTS } from '~/constants/TutorialConstants.js'
import Category from '~/models/Category.js'
import { ellipsizeText } from '~/utils/Utils.js'

const props = defineProps({})

const dataStore = useDataStore()
const profileStore = useProfileStore()

const emit = defineEmits(['change'])
const show = ref(false)

// const assistantText = ref('')
const assistantText = defineModel()
const assistantTextField = ref(null)

const foundCategory = ref(null)
const foundTag = ref(null)
const foundTemplate = ref(null)
const foundAmount = ref(null)
const foundDescription = ref(null)
const isTodo = ref(false)

const hasAmount = computed(() => {
  return foundAmount.value && foundAmount.value > 0
})

const fuseOptions = { includeScore: true, minMatchCharLength: 3, threshold: 0.6, distance: 100 }
const fuseConstants = {
  template: {
    weight: 1.0,
    type: 'template',
  },
  tag: {
    weight: 1.5,
    type: 'tag',
  },
  category: {
    weight: 1.5,
    type: 'category',
  },
}
const fuseTags = new Fuse([], { ...fuseOptions, keys: ['attributes.tag'] })
const fuseTransactionTemplate = new Fuse([], { ...fuseOptions, keys: ['name', 'extra_names'] })
const fuseCategories = new Fuse([], { ...fuseOptions, keys: ['attributes.name'] })

onMounted(() => {})

watch(
  dataStore.tagList,
  (newValue) => {
    fuseTags.setCollection(newValue)
  },
  { immediate: true },
)

watch(
  dataStore.transactionTemplateList,
  (newValue) => {
    fuseTransactionTemplate.setCollection(newValue)
  },
  { immediate: true },
)

watch(
  dataStore.categoryList,
  (newValue) => {
    fuseCategories.setCollection(newValue)
  },
  { immediate: true },
)

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
  searchWords = LanguageUtils.removeAccents(searchWords).trim()

  let numerical = match[2]
  let { wasSuccessful, value } = evalMath(numerical)
  foundAmount.value = numerical && wasSuccessful ? value.toString() : null

  foundDescription.value = match[3] || ''

  const fuseTemplateResults = fuseTransactionTemplate.search(searchWords)
  const fuseTagResults = fuseTags.search(searchWords)
  const fuseCategoryResults = fuseCategories.search(searchWords)

  let assistantGuesses = [
    {
      score: get(head(fuseTemplateResults), 'score') * fuseConstants.template.weight,
      type: fuseConstants.template.type,
      item: get(head(fuseTemplateResults), 'item'),
    },
    {
      score: get(head(fuseTagResults), 'score') * fuseConstants.tag.weight,
      type: fuseConstants.tag.type,
      item: get(head(fuseTagResults), 'item'),
    },
    {
      score: get(head(fuseCategoryResults), 'score') * fuseConstants.category.weight,
      type: fuseConstants.category.type,
      item: get(head(fuseCategoryResults), 'item'),
    },
  ]
    .filter((result) => !!result.item)
    .sort((a, b) => {
      return a.score - b.score
    })
  let bestGuess = head(assistantGuesses)

  if (bestGuess) {
    foundTemplate.value = bestGuess.type === fuseConstants.template.type ? bestGuess.item : null
    foundTag.value = bestGuess.type === fuseConstants.tag.type ? bestGuess.item : null
    foundCategory.value = bestGuess.type === fuseConstants.category.type ? bestGuess.item : null
  }

  //   , head(fuseTagResults), head(fuseCategoryResults)]

  // foundTemplate.value = get(fuseTemplateResults, '0.item')
  // if (foundTemplate.value) {
  //   foundTag.value = null
  //   return
  // }
  //
  // foundTag.value = get(fuseTagResults, '0.item')
}

watch(assistantText, (newValue) => {
  processReceivedTextDebounce()
})

const processReceivedTextDebounce = debounce(processAssistantText, 200)

const onSubmit = () => {
  // emit('change', {
  //   transactionTemplate: foundTemplate.value,
  //   amount: foundAmount.value,
  // })
}

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

watch([foundTemplate, foundTag, foundCategory, foundAmount, foundDescription, isTodo], ([newTemplate, newTag, newCategory, newAmount, newDescription, newIsTodo]) => {
  emit('change', {
    transactionTemplate: newTemplate,
    amount: newAmount,
    tag: newTag,
    category: newCategory,
    description: newDescription,
    isTodo: newIsTodo,
  })

  // If you selected a template and didn't write anything => write the text
  if (assistantText.value === '' && newTemplate) {
    assistantText.value = get(newTemplate, 'extra_names.0.name', '')
  }
})

// -----
</script>

<style scoped></style>
