<template>
  <div class="app-form">
    <app-top-toolbar>
      <template #right>
        <app-button-list-add v-if="itemId" @click="onNew" />
      </template>
    </app-top-toolbar>

    <app-card-info v-if="itemId">
      <app-field-link :label="$t('show_transactions')" :icon="TablerIconConstants.transaction" @click="onNavigateToTransactionsList" />
      <app-field-link :label="computeTotalLabel" :icon="TablerIconConstants.cash" @click="onComputeTotal" />
    </app-card-info>

    <van-form ref="form" :name="formName" class="" @submit="saveItem" @failed="onValidationError">
      <van-cell-group inset>
        <app-field v-model="tag" name="name" :label="$t('name')" rows="1" autosize :icon="TablerIconConstants.fieldText2" :rules="[rule.required()]" required />
        <tag-select v-model="parentTag" :label="$t('tag_page.parent_tag')" :is-multi-select="false" />
        <app-field v-model="description" name="description" :label="$t('description')" autosize :icon="TablerIconConstants.fieldText1" />
        <app-date v-model="date" :label="$t('tag_page.end_date')" :icon="TablerIconConstants.settingsUserPreferencesDate" />
        <icon-select v-model="icon" />

        <app-boolean v-model="isTodo">
          <template #label>
            <div class="flex items-center gap-1">
              <div class="flex-1">{{ $t('tag_page.mark_as_todo') }}</div>
              <app-tutorial v-bind="TUTORIAL_CONSTANTS.todoTag" />
            </div>
          </template>
        </app-boolean>
      </van-cell-group>

      <div style="margin: 16px">
        <app-button-form-save />

        <app-button-form-delete v-if="itemId" class="mt-2.5" @click="onDelete" />
      </div>
    </van-form>

    <!--    </van-pull-refresh>-->
  </div>
</template>

import { ref } from 'vue';

<script setup>
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
  totalLabel: computeTotalLabel,
  computeTotal: onComputeTotal,
} = useTagForm()

const onNavigateToTransactionsList = () => navigateTo(transactionsRoute.value)

const toolbar = useToolbar()
const { t } = useI18n()

toolbar.init({
  title: itemId.value ? t('tag_page.title_edit') : t('tag_page.title_add'),
  backRoute: RouteConstants.ROUTE_TAG_LIST,
})
</script>
