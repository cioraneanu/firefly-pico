export default class Page {
  static get types() {
    // TODO: Before i18n this was {name, code} and persisted in localStorage as such. Probably need a migration?
    return {
      transactionNew: {
        t: 'settings.ui.pages.new_transacation',
        code: 'transaction',
      },
      transactionList: {
        t: 'settings.ui.pages.transacation_list',
        code: 'transactionList',
      },
      dashboard: {
        t: 'settings.ui.pages.dashboard',
        code: 'dashboard',
      },
    }
  }

  static typesList() {
    return Object.values(this.types)
  }
}
