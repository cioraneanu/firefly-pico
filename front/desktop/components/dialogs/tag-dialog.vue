<template>
  <d-form-dialog :form :title="$t(form.itemId ? 'tag_page.title_edit' : 'tag_page.title_add')" @close="close">
    <template v-if="form.itemId" #info>
      <d-info>
        <d-button variant="ghost" size="sm" :icon="IconCoins" :to="form.transactionsRoute" class="text-fg">{{ $t('show_transactions') }}</d-button>
        <d-button variant="ghost" size="sm" :icon="IconCash" :loading="form.isComputingTotal" class="text-fg" @click="form.computeTotal">{{ $t('tag_page.compute_total') }}</d-button>
        <span v-if="form.totalFormatted" class="ml-auto pr-1.5">
          {{ $t('tag_page.total') }}: <b class="font-medium tabular-nums text-fg">{{ form.totalFormatted }}</b>
        </span>
      </d-info>
    </template>
    <d-field :label="$t('name')" :rules="[rule.required()]" :value="form.tag">
      <d-input v-model="form.tag" autofocus />
    </d-field>
    <d-field :label="$t('tag_page.parent_tag')">
      <d-tag-select v-model="form.parentTag" :exclude="excluded" />
    </d-field>
    <d-field :label="$t('description')" top>
      <d-textarea v-model="form.description" />
    </d-field>
    <d-field :label="$t('tag_page.end_date')">
      <d-date v-model="form.date" clearable />
    </d-field>
    <d-field :label="$t('icon')">
      <d-icon-select v-model="form.icon" />
    </d-field>
    <div class="h-px bg-line" />
    <d-field :label="$t('tag_page.mark_as_todo')" :hint="$t('desktop.todo_hint')">
      <d-switch v-model="form.isTodo" />
    </d-field>
  </d-form-dialog>
</template>

<script setup>
import { IconCash, IconCoins } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import Tag from '~/core/models/Tag'
import { rule } from '~/core/utils/ValidationUtils'

const tagStore = useTagStore()
const { close } = useRouteDialog(RouteConstants.ROUTE_TAG_LIST)
const form = reactive(useTagForm({ routeForm: null, onEvent: (event) => event === useFormEvent.postSave && close() }))

const excluded = computed(() => tagStore.tagList.filter((tag) => Tag.getTagWithParents(tag).some((parent) => parent.id === form.itemId)).map((tag) => tag.id))
</script>
