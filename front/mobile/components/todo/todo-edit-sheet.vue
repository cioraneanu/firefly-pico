<template>
  <Teleport to="#mx-portal" defer>
    <transition name="mx-fd" appear>
      <button v-if="isOpen" type="button" class="mx-ov td-esh-ov" tabindex="-1" :aria-label="$t('close')" @click="close" />
    </transition>
    <transition name="mx-sh" @after-leave="leave">
      <div v-if="isOpen" class="td-esh" :class="{ drag: isDragging, back: !isDragging }" :style="dragY ? { '--dy': `${dragY}px` } : null" role="dialog" aria-modal="true" :aria-label="title">
        <div class="td-grab" aria-hidden="true" @pointerdown="onGrabDown" @pointermove="onGrabMove" @pointerup="onGrabUp" @pointercancel="onGrabUp"><span /></div>
        <div class="td-esh__b">
          <div class="mx-page">
            <header class="mx-top">
              <div class="mx-top__t">
                <h1>{{ title }}</h1>
              </div>
              <div class="mx-top__a">
                <button type="button" class="mx-ib sm" :aria-label="$t('close')" @click="close">
                  <app-icon :icon="IconX" :size="16" :stroke="2" />
                </button>
              </div>
            </header>

            <app-form v-if="isReady" :name="formName" @submit="onSubmit" @failed="onValidationError">
              <main class="mx-body" :class="{ 'has-save': !isSplitTransaction }">
                <transaction-form v-model="item">
                  <template #actions>
                    <app-button-form-delete v-if="itemId" @click="onDelete" />
                  </template>
                </transaction-form>
              </main>

              <div v-if="!isSplitTransaction" class="mx-save">
                <button type="submit" class="mx-btn" :class="isDone ? 'pri' : 'out'" @click="isSavingDone = false">
                  <app-icon v-if="isDone" :icon="IconCheck" :size="16" :stroke="2" />
                  <span>{{ $t('save') }}</span>
                </button>
                <button v-if="!isDone" type="submit" class="mx-btn pri" @click="isSavingDone = true">
                  <app-icon :icon="IconCheck" :size="16" :stroke="2" />
                  <span>{{ $t('todo_page.save_done') }}</span>
                </button>
              </div>
            </app-form>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { get } from 'lodash-es'
import { IconCheck, IconX } from '@tabler/icons-vue'
import RouteConstants from '~/core/constants/RouteConstants'
import TransactionForm from '~/mobile/components/transaction/TransactionForm.vue'

// TODO Inbox editor (design: MX-TodoInbox, td-esh): the transaction form in a 90% sheet over the inbox,
// opened by the route (/todo/42). Drag the handle down to close it.
defineProps({
  isDone: Boolean,
})

const todoStore = useTodoStore()
// Slides out first, then leaves the route (after-leave)
const isOpen = ref(true)
const close = () => (isOpen.value = false)
// Opened from the inbox: step back, so the inbox's back arrow does not reopen the editor
const router = useRouter()
const leave = () => (router.options.history.state.back === RouteConstants.ROUTE_TODO ? router.back() : navigateTo(RouteConstants.ROUTE_TODO, { replace: true }))

const onEvent = (event, response) => {
  if (event === useFormEvent.postSave) {
    todoStore.onSaved(todoStore.fromApi(get(response, 'data.data')))
    close()
  }
  if (event === useFormEvent.postDelete) todoStore.onDeleted(itemId.value)
}

const { isReady, itemId, item, saveItem, onDelete, onValidationError, formName, isSplitTransaction, title } = useTransactionEditor({
  routeForm: null,
  routeList: RouteConstants.ROUTE_TODO,
  onEvent,
})

const isSavingDone = ref(false)
// A failed "Save & done" gives the form its #todo tag back, so a later Save keeps it
const onSubmit = async () => {
  const original = item.value
  if (isSavingDone.value) item.value = todoStore.withoutTodoTag(original)
  const response = await saveItem()
  if (!ResponseUtils.isSuccess(response)) item.value = original
}

const dragY = ref(0)
const isDragging = ref(false)
let startY = 0
const onGrabDown = (event) => {
  event.currentTarget.setPointerCapture?.(event.pointerId)
  startY = event.clientY
  isDragging.value = true
}
const onGrabMove = (event) => {
  if (isDragging.value) dragY.value = Math.max(0, event.clientY - startY)
}
const onGrabUp = () => {
  if (!isDragging.value) return
  isDragging.value = false
  if (dragY.value > 110) close()
  else dragY.value = 0
}
</script>
