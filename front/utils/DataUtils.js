// export function sortByPath = (list, path) => list.sort((a,b) => (a.attributes.tag > b.attributes.tag) ? 1 : ((b.attributes.tag > a.attributes.tag) ? -1 : 0))

import { get } from 'lodash'

export const sortByPath = (list, path, isAsc = true) =>
  list.sort((a, b) => {
    let value1 = (get(a, path) ?? '').toString().toLowerCase()
    let value2 = (get(b, path) ?? '').toString().toLowerCase()
    let direction = isAsc ? 1 : -1
    return value1 > value2 ? direction : value2 > value1 ? -1 * direction : 0
  })

// export const sortByPath = ({ list, path, isAsc = true, isNumeric = false, ignoreCase = true, shouldRemoveAccents = true } = {}) => list.sort((a, b) => {
//   let valueA = get(a, path, '').toString()
//   let valueB = get(b, path, '').toString()
//
//   if (ignoreCase) {
//     valueA = valueA.toLowerCase()
//     valueB = valueB.toLowerCase()
//   }
//
//   if (shouldRemoveAccents) {
//     valueA = LanguageUtils.removeAccentsAndForceLowerCase(valueA)
//     valueB = LanguageUtils.removeAccentsAndForceLowerCase(valueB)
//   }
//
//   if (isNumeric) {
//     valueA = parseFloat(valueA)
//     valueB = parseFloat(valueB)
//   }
//
//   return valueA === valueB ? 0 : (valueA < valueB ? -1 : 1) * (isAsc ? 1 : -1)
// })

export const areIntEqual = (a, b) => {
  return parseInt(a) === parseInt(b)
}

export const areStringEqual = (a, b) => {
  return a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
}

export const isStringEmpty = (value) => {
  return !value || value.length === 0
}

export const listToTree = (flatList) => {
  const map = {}
  const tree = []

  // Create a map where the keys are the IDs and the values are the items
  flatList.forEach((item) => {
    map[item.id] = { ...item, children: [] }
  })

  // Iterate through the items to build the tree
  flatList.forEach((item) => {
    if (item.attributes && item.attributes.parent_id && map[item.attributes.parent_id]) {
      // If the item has a parent, add it as a child of the parent
      map[item.attributes.parent_id].children.push(map[item.id])
    } else {
      // If the item has no parent, add it to the top level of the tree
      tree.push(map[item.id])
    }
  })

  // Function to recursively set the level of each node in the tree
  function setLevel(node, level) {
    node.level = level
    node.children.forEach((child) => setLevel(child, level + 1))
  }

  // Set the level of each node starting from the root
  tree.forEach((root) => setLevel(root, 1))

  return tree
}

export const treeToList = (tree) => {
  return tree.reduce((acc, node) => {
    acc.push({ ...node }) // Copy the node to avoid modifying the original tree
    if (node.children.length > 0) {
      acc.push(...treeToList(node.children)) // Recursively flatten children
    }
    return acc
  }, [])
}

export const setLevel = (data, parentId = null, level = 0) => {
  for (const item of data) {
    if (item.parent_id === parentId) {
      item.level = level + 1
      setLevel(data, item.id, level + 1)
    }
  }
}

export const compareVersionStrings = (a, b) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

export const convertFireflyToPicoUrl = (url) => {
  const parsed = new URL(url)
  const newPath = parsed.pathname.replace('/api/v1', '/api')
  let picoBackendURL = useAppStore().picoBackendURL

  return `${picoBackendURL}${newPath}`
}

export const blobToJson = async (blob) => {
  const text = await blob.text() // Convert Blob to string
  try {
    return JSON.parse(text)
  } catch (error) {
    return null
  }
}
