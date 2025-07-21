
export default defineNuxtRouteMiddleware((to, from) => {
  // Chrome-iOS scroll persistence is wacky. When navigating to a page with long content it doesn't start from top
  useDevice().isIos ? window.scrollTo(0, -100) : null
})
