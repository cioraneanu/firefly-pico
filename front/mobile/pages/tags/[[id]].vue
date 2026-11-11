<template>
  <div class="mx-page">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <app-form :name="formName" @submit="saveItem" @failed="onValidationError">
      <main class="mx-body has-save">
        <app-card-info v-if="itemId">
          <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
          <app-field-link :label="computeTotalLabel" :icon="IconSum" :is-link="false" @click="onComputeTotal">
            <template #right>
              <span v-if="isComputingTotal" class="mx-spin" />
            </template>
          </app-field-link>
        </app-card-info>

        <app-card>
          <app-field v-model="tag" name="name" :label="$t('name')" :rules="[rule.required()]" required />
          <tag-select v-model="parentTag" :label="$t('tag_page.parent_tag')" :is-multi-select="false" />
          <app-field v-model="description" name="description" :label="$t('description')" />

          <div class="mx-2">
            <app-date v-model="date" :label="$t('tag_page.end_date')" />
            <icon-select v-model="icon" />
          </div>

          <div class="mx-hr" />
          <div class="mx-tg">
            <span class="m">
              <b>{{ $t('tag_page.mark_as_todo') }}<app-tutorial v-bind="TUTORIAL_CONSTANTS.todoTag" /></b>
              <span>{{ $t('desktop.todo_hint') }}</span>
            </span>
            <button type="button" class="mx-sw" :class="{ on: !!isTodo }" role="switch" :aria-checked="!!isTodo" :aria-label="$t('tag_page.mark_as_todo')" @click="isTodo = !isTodo" />
          </div>
        </app-card>

        <app-button-form-delete v-if="itemId" @click="onDelete" />
      </main>

      <app-button-form-save />
    </app-form>
  </div>
</template>

<script setup>
import { IconSum } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import { useToolbar } from '~/mobile/composables/useToolbar'
import { TUTORIAL_CONSTANTS } from '~/core/constants/TutorialConstants.js'
import TablerIconConstants from '~/core/constants/TablerIconConstants.js'
import { rule } from '~/core/utils/ValidationUtils.js'

const {
  itemId,
  saveItem,
  onDelete,
  onNew,
  onValidationError,
  formName,
  tag,
  description,
  date,
  parentTag,
  icon,
  isTodo,
  transactionsRoute,
  isComputingTotal,
  totalLabel: computeTotalLabel,
  computeTotal: onComputeTotal,
} = useTagForm()

const onNavigateToTransactionsList = () => navigateTo(transactionsRoute.value)

const { t } = useI18n()
useToolbar().init({
  title: itemId.value ? t('tag_page.title_edit') : t('tag_page.title_add'),
  backRoute: RouteConstants.ROUTE_TAG_LIST,
})
</script>
