export default defineNuxtPlugin((nuxtApp) => {
  Array.prototype.uniqBy = function (field) {
    return [...new Map(this.map((item) => [item[field], item])).values()]
  }
})
