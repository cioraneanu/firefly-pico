import axios from 'axios'
import * as basicLightbox from 'basiclightbox'
import 'basiclightbox/dist/basicLightbox.min.css'
import { get } from 'lodash'
import { blobToJson } from '~/utils/DataUtils.js'

export function useImage(prop) {
  const show = async (url) => {
    const response = await axios.get(url, { responseType: 'blob' })
    if (!ResponseUtils.isSuccess(response)) {
      const responseBody = await blobToJson(response.data)
      const errorMessage = get(responseBody, 'message') ?? "Error occurred"
      UIUtils.showToastError(errorMessage)
      return
    }

    const blobUrl = URL.createObjectURL(response.data)
    const instance = basicLightbox.create(`<img src="${blobUrl}" style="max-width: 100vw; max-height: 100vh;" />`)
    instance.show()
  }

  return { show }
}
