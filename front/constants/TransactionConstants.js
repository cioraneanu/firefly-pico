import TablerIconConstants from '~/constants/TablerIconConstants.js'

export const transactionFormFieldsConfig = {
  amount: {
    code: 'amount',
    name: 'Amount',
    icon: TablerIconConstants.cashBanknote,
    isVisible: true,
  },
  sourceAccount: {
    code: 'sourceAccount',
    name: 'Source account',
    icon: TablerIconConstants.account,
    isVisible: true,
  },
  tags: {
    code: 'tags',
    name: 'Tags',
    icon: TablerIconConstants.tag,
    isVisible: true,
  },
  description: {
    code: 'description',
    name: 'Description',
    icon: TablerIconConstants.fieldText2,
    isVisible: true,
  },
  category: {
    code: 'category',
    name: 'Category',
    icon: TablerIconConstants.category,
    isVisible: true,
  },
  date: {
    code: 'date',
    name: 'Date',
    icon: TablerIconConstants.settingsUserPreferencesDate,
    isVisible: true,
  },
  notes: {
    code: 'notes',
    name: 'Notes',
    icon: TablerIconConstants.fieldText1,
    isVisible: true,
  },
  destinationAccount: {
    code: 'destinationAccount',
    name: 'Destination account',
    icon: TablerIconConstants.account,
    isVisible: true,
  },
  budget: {
    code: 'budget',
    name: 'Budget',
    icon: TablerIconConstants.budget,
    isVisible: true,
  },
}


export const transactionListFieldsConfig = {
  accounts: {
    code: 'accounts',
    name: 'Accounts',
    icon: TablerIconConstants.account,
    isVisible: true,
  },
  tags: {
    code: 'tags',
    name: 'Tags',
    icon: TablerIconConstants.tag,
    isVisible: true,
  },
  category: {
    code: 'category',
    name: 'Category',
    icon: TablerIconConstants.category,
    isVisible: true,
  },
  notes: {
    code: 'notes',
    name: 'Notes',
    icon: TablerIconConstants.fieldText1,
    isVisible: true,
  },
  // budget: {
  //   code: 'budget',
  //   name: 'Budget',
  //   isVisible: true,
  // },
}

// export const transactionListHeroIconConfig = {
//   account: { code: 'account', name: 'Account icon' },
//   tags: { code: 'tags', name: 'Tag icon' },
//   category: { code: 'category', name: 'Category icon' },
// }

export const transactionListHeroIconConfig = {
  dayOfWeek: { code: 'dayOfWeek', name: 'Day of week' },
  account: { code: 'account', name: 'Account' },
  tags: { code: 'tags', name: 'Tag' },
  category: { code: 'category', name: 'Category' },
}


export const transactionListFieldsConfigList = Object.values(transactionListFieldsConfig)

export const transactionListHeroIconConfigList = Object.values(transactionListHeroIconConfig)
export const transactionFormFieldsConfigList = Object.values(transactionFormFieldsConfig)




