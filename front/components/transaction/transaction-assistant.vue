<template>

  <div class="vant-card flex-column mt-5">
    <div class="vant-card-title flex-center-vertical gap-1">
      Assistant
      <!--      <app-icon icon="svgo-speed1" :size="20"/>-->
      <app-tutorial v-bind="TUTORIAL_CONSTANTS.assistant"/>
    </div>
    <div class="text-size-12 text-muted mb-5">Format = [template | tag] [amount?] [description?]</div>


    <div class="display-flex  flex-column">
      <div class="flex-center-vertical gap-2">
        <app-field
            ref="assistantTextField"
            class="van-cell-no-padding compact flex-1"
            v-model="assistantText"
            label=""
            type="textarea"
            placeholder="Assistant..."
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
        <div class="display-flex flex-center-vertical gap-2 p-5 mt-10 text-size-12 flex-wrap"
             style="border: 1px dashed black; border-radius: 5px">


          <template v-if="foundTemplate">

            <van-tag
                round
                class="assistant-tag"
                size="medium"
                type="primary">
              <!--              <app-icon :icon="TablerIconConstants.transactionTemplate" color="#fff" class="mr-5" :size="15"/>-->
              <span>Template</span>
              <span>|</span>
              {{ TransactionTemplate.getDisplayName(foundTemplate) }}
            </van-tag>
          </template>

          <template v-if="foundTag">

            <van-tag
                round
                class="assistant-tag"
                size="medium"
                type="primary">
              <!--              <app-icon :icon="TablerIconConstants.tag" color="#fff" class="" :size="15"/>-->
              <span>Tag</span>
              <span>|</span>
              {{ Tag.getDisplayName(foundTag) }}
            </van-tag>
          </template>

          <template v-if="foundCategory">

            <van-tag
                round
                class="assistant-tag"
                size="medium"
                type="primary">
              <!--              <app-icon :icon="TablerIconConstants.category" color="#fff" class="mr-5" :size="15"/>-->
              <span>Category:</span>
              <span>|</span>
              {{ Category.getDisplayName(foundCategory) }}
            </van-tag>
          </template>

          <template v-if="foundAmount">

            <van-tag
                class="assistant-tag"
                round
                size="medium"
                type="primary">
              <span>Amount</span>
              <span>|</span>
              <span>{{ foundAmount }}</span>
            </van-tag>
          </template>

          <template v-if="foundDescription">
            <van-tag
                class="assistant-tag"
                round
                size="medium"
                type="primary">
              <span>Description</span>
              <span>|</span>
              <span>{{ ellipsizeText(foundDescription, 20) }}</span>
            </van-tag>
          </template>

          <div class="flex-1"/>
          <!--          <van-button @click="onClear" size="small">Clear</van-button>-->
        </div>

      </template>
    </div>

    <transaction-template-popup
        v-model:show="show"
        v-model="foundTemplate"
    />


  </div>


</template>


<script setup>
import {onMounted, watch} from 'vue'
import {useDataStore} from '~/stores/dataStore'
import TransactionTemplate from '~/models/TransactionTemplate'
import {debounce} from 'lodash/function'
import {get, head} from 'lodash'
import Tag from '~/models/Tag'
import Fuse from 'fuse.js'
import AppTutorial from '~/components/ui-kit/app-tutorial.vue'
import {TUTORIAL_CONSTANTS} from '~/constants/TutorialConstants.js'
import Category from '~/models/Category.js'
import {ellipsizeText} from '~/utils/Utils.js'

const props = defineProps({})

const dataStore = useDataStore()
const appStore = useAppStore()

const emit = defineEmits(['change'])
const show = ref(false)

const assistantText = ref('')
const assistantTextField = ref(null)

const foundCategory = ref(null)
const foundTag = ref(null)
const foundTemplate = ref(null)
const foundAmount = ref(null)
const foundDescription = ref(null)

const hasAmount = computed(() => {
  return foundAmount.value && foundAmount.value > 0
})

const fuseOptions = {includeScore: true, minMatchCharLength: 3, threshold: 0.6, distance: 100}
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
const fuseTags = new Fuse([], {...fuseOptions, keys: ['attributes.tag']})
const fuseTransactionTemplate = new Fuse([], {...fuseOptions, keys: ['name', 'extra_names']})
const fuseCategories = new Fuse([], {...fuseOptions, keys: ['attributes.name']})

onMounted(() => {

})

watch(dataStore.tagList, (newValue) => {
  fuseTags.setCollection(newValue)
}, {immediate: true})

watch(dataStore.transactionTemplateList, (newValue) => {
  fuseTransactionTemplate.setCollection(newValue)
}, {immediate: true})

watch(dataStore.categoryList, (newValue) => {
  fuseCategories.setCollection(newValue)
}, {immediate: true})

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

  text = LanguageUtils.removeAccents(text)
  text = RomanianLanguageUtils.fixBadWordNumbers(text)
  text = text.replace(',', '.')
  let words = text.split(' ')

  let amountWords = words.filter(item => isStringAMathExpression(item))
  amountWords = amountWords.map(item => {
    let {wasSuccessful, value} = evalMath(item)
    return wasSuccessful ? value : 0
  })
  foundAmount.value = amountWords.length === 0 ? null : amountWords.reduce((total, value) => {
    return total + parseInt(value)
  }, 0).toString()

  // let templateWords = words.filter(item => isNaN(item)).join(' ')

  let indexOfLastAmount = words.findLastIndex(item => isStringAMathExpression(item))
  // let searchWords = words.filter(item => !isStringAMathExpression(item)).join(' ')
  let searchWords = indexOfLastAmount < 0 ? words.join(' ') : words.slice(0, indexOfLastAmount).join(' ')
  let descriptionWords = indexOfLastAmount < 0 ? null : words.slice(indexOfLastAmount).filter(item => !isStringAMathExpression(item)).join(' ')
  foundDescription.value = descriptionWords

  // receivedWords = RomanianLanguageUtils.sanitize(receivedWords)

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
  ].filter(result => !!result.item).sort((a, b) => {
    return a.score - b.score
  })
  let bestGuess = head(assistantGuesses)

  if (bestGuess) {
    foundTemplate.value = (bestGuess.type === fuseConstants.template.type) ? bestGuess.item : null
    foundTag.value = (bestGuess.type === fuseConstants.tag.type) ? bestGuess.item : null
    foundCategory.value = (bestGuess.type === fuseConstants.category.type) ? bestGuess.item : null
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
  // let a1 = 'dsadsa22'
  // let a2 = '232'
  // let a3 = '232+22*3'
  //
  // let r1 = isStringAMathExpression(a1)
  // let r2 = isStringAMathExpression(a2)
  // let r3 = isStringAMathExpression(a3)
}

watch([foundTemplate, foundTag, foundCategory, foundAmount, foundDescription], ([newTemplate, newTag, newCategory, newAmount, foundDescription]) => {
  emit('change', {
    transactionTemplate: newTemplate,
    amount: newAmount,
    tag: newTag,
    category: newCategory,
    description: foundDescription
  })

  // If you selected a template and didn't write anything => write the text
  if (assistantText.value === '' && newTemplate) {
    assistantText.value = get(newTemplate, 'extra_names.0.name', '')
  }
})

// -----


</script>


<style scoped>
</style>
