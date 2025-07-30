import { onMounted, ref } from 'vue'
import UIUtils from '~/utils/UIUtils'
import _, { get } from 'lodash'
import axios from 'axios'


export function useImage(prop) {
  const show = async (url) => {
    try {
      const response = await axios.get(url, { responseType: 'blob' })

      const blobUrl = URL.createObjectURL(response.data)

      const overlay = document.createElement('div')
      overlay.id = 'image-overlay'

      const img = document.createElement('img')
      img.src = blobUrl

      overlay.appendChild(img)

      // Optional: Click to remove the overlay
      overlay.addEventListener('click', () => {
        overlay.remove()
        URL.revokeObjectURL(blobUrl)
      })

      document.body.appendChild(overlay)
    } catch (err) {
      console.error('Error fetching image:', err)
    }
  }

  return { show }
}
