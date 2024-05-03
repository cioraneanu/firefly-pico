
export default class ApiTransformer  {

  static transformFromApi () {
    //TODO: What if we just iterate over the object param and convert to camelCase
    throw new Error('You have to implement the method transformFromApi!')
  }

  static transformFromApiList (list) {
    return list.map(currentItem => this.transformFromApi(currentItem))
  }

  static transformFromApiTable (table) {
    table.data = this.transformFromApiList(table.data)
    return table
  }

  // ---------------------------------------------------------

  static transformToApi () {
    throw new Error('You have to implement the method transformForApi!')
  }

  static transformToApiList (list) {
    return list.map(currentItem => this.transformToApi(currentItem))
  }

  static transformToApiTable (table) {
    table.data = this.transformToApiList(table.data)
    return table
  }

}