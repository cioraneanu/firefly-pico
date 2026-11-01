import { IconArrowsExchange, IconSquareRoundedMinus, IconSquareRoundedPlus } from '@tabler/icons-vue'
import Transaction from '~/core/models/Transaction'

const icons = { expense: IconSquareRoundedMinus, income: IconSquareRoundedPlus, transfer: IconArrowsExchange }

export function useTransactionTypeOptions() {
  const { t } = useI18n()
  return computed(() => Transaction.typesList.map((type) => ({ value: type, label: t(type.t), icon: icons[type.code] })))
}
