import TablerIconConstants from '~/constants/TablerIconConstants.js'

export const transactionFormField = {
  amount: {
    t: 'amount',
    code: 'amount',
    icon: TablerIconConstants.cashBanknote,
    isVisible: true,
  },
  sourceAccount: {
    t: 'transaction.source_account',
    code: 'sourceAccount',
    icon: TablerIconConstants.account,
    isVisible: true,
  },
  tags: {
    t: 'tags',
    code: 'tags',
    icon: TablerIconConstants.tag,
    isVisible: true,
  },
  description: {
    t: 'description',
    code: 'description',
    icon: TablerIconConstants.fieldText2,
    isVisible: true,
  },
  category: {
    t: 'category',
    code: 'category',
    icon: TablerIconConstants.category,
    isVisible: true,
  },
  date: {
    t: 'date',
    code: 'date',
    icon: TablerIconConstants.settingsUserPreferencesDate,
    isVisible: true,
  },
  interestDate: {
    t: 'transaction.interest_date',
    code: 'interestDate',
    fireflyCode: 'interest_date',
    icon: TablerIconConstants.settingsUserPreferencesDate,
    isVisible: false,
  },
  bookDate: {
    t: 'transaction.book_date',
    code: 'bookDate',
    fireflyCode: 'book_date',
    icon: TablerIconConstants.settingsUserPreferencesDate,
    isVisible: false,
  },
  processDate: {
    t: 'transaction.process_date',
    code: 'processDate',
    fireflyCode: 'process_date',
    icon: TablerIconConstants.settingsUserPreferencesDate,
    isVisible: false,
  },
  dueDate: {
    t: 'transaction.due_date',
    code: 'dueDate',
    fireflyCode: 'due_date',
    icon: TablerIconConstants.settingsUserPreferencesDate,
    isVisible: false,
  },
  paymentDate: {
    t: 'transaction.payment_date',
    code: 'paymentDate',
    fireflyCode: 'payment_date',
    icon: TablerIconConstants.settingsUserPreferencesDate,
    isVisible: false,
  },
  invoiceDate: {
    t: 'transaction.invoice_date',
    code: 'invoiceDate',
    fireflyCode: 'invoice_date',
    icon: TablerIconConstants.settingsUserPreferencesDate,
    isVisible: false,
  },
  notes: {
    t: 'notes',
    code: 'notes',
    icon: TablerIconConstants.fieldText1,
    isVisible: true,
  },
  destinationAccount: {
    t: 'transaction.destination_account',
    code: 'destinationAccount',
    icon: TablerIconConstants.account,
    isVisible: true,
  },
  budget: {
    t: 'budget',
    code: 'budget',
    icon: TablerIconConstants.budget,
    isVisible: true,
  },
  piggyBank: {
    t: 'piggy_bank',
    code: 'piggyBank',
    icon: TablerIconConstants.piggyBank,
    isVisible: true,
  },
  attachments: {
    t: 'attachments',
    code: 'attachments',
    icon: TablerIconConstants.attachment,
    isVisible: true,
  },
}

export const transactionListField = {
  accounts: {
    t: 'accounts',
    code: 'accounts',
    icon: TablerIconConstants.account,
    isVisible: true,
  },
  category: {
    t: 'category',
    code: 'category',
    icon: TablerIconConstants.category,
    isVisible: true,
  },
  notes: {
    t: 'notes',
    code: 'notes',
    icon: TablerIconConstants.fieldText1,
    isVisible: true,
  },
  tags: {
    t: 'tags',
    code: 'tags',
    icon: TablerIconConstants.tag,
    isVisible: true,
  },
  budget: {
    code: 'budget',
    name: 'Budget',
    isVisible: true,
  },
}

export const transactionListHeroIcon = {
  dayOfWeek: { code: 'dayOfWeek', t: 'day_of_week' },
  account: { code: 'account', t: 'account' },
  tags: { code: 'tags', t: 'tag' },
  category: { code: 'category', t: 'category' },
}

export const transactionListFieldList = Object.values(transactionListField)
export const transactionExtraDateFieldList = Object.values(transactionFormField).filter((field) => field.fireflyCode)
export const transactionListHeroIconList = Object.values(transactionListHeroIcon)
export const transactionFormFieldList = Object.values(transactionFormField)
