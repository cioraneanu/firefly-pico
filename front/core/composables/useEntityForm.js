import { cloneDeep, get } from 'lodash-es'
import { areIntEqual } from '~/core/utils/DataUtils'

export function useEntityForm({ list, dictionary, transformer, onEvent, ...options }) {
  const sync = (event, payload) => {
    const others = list.value.filter((item) => !areIntEqual(item.id, form.itemId.value))
    if (event === useFormEvent.postSave) list.value = [transformer.transformFromApi(get(payload, 'data.data')), ...others]
    if (event === useFormEvent.postDelete) list.value = others
    onEvent?.(event, payload)
  }

  const form = useForm({
    fetchItem: dictionary && (() => (form.item.value = cloneDeep(toValue(dictionary)[useRoute().params.id]))),
    ...options,
    onEvent: sync,
  })

  return { ...form, sync }
}
