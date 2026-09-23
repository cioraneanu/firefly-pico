// IndexedDB-backed storage for the big synced lists.
//
// localStorage is a ~5MB per-origin quota shared by every key we write, and writing to it
// serializes JSON synchronously on the main thread. Accounts, tags and transactions grow
// large enough for both to matter: a busy Firefly III makes the app janky first and then
// starts throwing QuotaExceededError on write. IndexedDB has neither limit.
//
// IndexedDB only reads asynchronously, but the stores and list screens read their lists
// synchronously during setup (`list.value = categoryStore.categoryList`). So the whole store
// is pulled into memory once, before the app mounts (see plugins/00.idb-storage.js), and
// reads are served from there. Writes go to IndexedDB in the background.

import { ref, toRaw, watch } from 'vue'

const DB_NAME = 'firefly-pico'
const STORE_NAME = 'keyval'
const DB_VERSION = 1

// Raw (still serialized) values, filled in by preloadIdbStorage().
const cache = new Map()
let hasIndexedDb = false
let databasePromise = null

// Every open tab holds these lists in memory, so tell the others when ours change or they would
// keep showing (and later write back) stale lists. useLocalStorage got this from storage events.
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('firefly-pico-storage')
const refs = new Map()
// Values that arrived from another tab, so our watcher does not write and broadcast them again.
const receivedValues = new WeakSet()

channel?.addEventListener('message', ({ data: { key, rawValue } }) => {
  if (hasIndexedDb) {
    cache.set(key, rawValue)
  }
  const data = refs.get(key)
  if (!data) {
    return
  }
  const value = JSON.parse(rawValue)
  receivedValues.add(value)
  data.value = value
})

function openDatabase() {
  if (databasePromise) {
    return databasePromise
  }

  databasePromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
      request.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })

  return databasePromise
}

function runTransaction(database, mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const request = action(transaction.objectStore(STORE_NAME))
    transaction.oncomplete = () => resolve(request?.result ?? null)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

// Where these lists used to live, and still do wherever IndexedDB is unavailable
// (private windows, blocked site data).
const legacyStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Quota or blocked storage - the value simply is not persisted.
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Nothing to do.
    }
  },
}

/**
 * Reads the whole store into memory. Must finish before the app mounts.
 */
export async function preloadIdbStorage() {
  const database = await openDatabase()
  hasIndexedDb = !!database
  if (!database) {
    return
  }

  try {
    const keys = await runTransaction(database, 'readonly', (store) => store.getAllKeys())
    const values = await runTransaction(database, 'readonly', (store) => store.getAll())
    keys.forEach((key, index) => cache.set(key, values[index]))
  } catch {
    hasIndexedDb = false
  }
}

function write(key, rawValue) {
  if (!hasIndexedDb) {
    legacyStorage.setItem(key, rawValue)
    return
  }

  cache.set(key, rawValue)
  openDatabase().then((database) => {
    if (!database) {
      return
    }
    runTransaction(database, 'readwrite', (store) => store.put(rawValue, key)).catch(() => {
      // A failed write only costs us the cached copy on the next load.
    })
  })
}

function read(key) {
  if (!hasIndexedDb) {
    return legacyStorage.getItem(key)
  }

  if (cache.has(key)) {
    return cache.get(key)
  }

  // First load after the upgrade: adopt what the install already had in localStorage and
  // give that quota back.
  const legacyValue = legacyStorage.getItem(key)
  if (legacyValue !== null) {
    write(key, legacyValue)
    legacyStorage.removeItem(key)
  }

  return legacyValue
}

/**
 * Drop-in replacement for useLocalStorage for lists that can grow without bound.
 *
 * The watcher is deliberately shallow: every store using this replaces its list wholesale
 * rather than mutating it, and deep-watching thousands of objects on every change is exactly
 * the cost this module exists to avoid.
 */
export function useIdbStorage(key, initialValue) {
  const rawValue = read(key)

  let storedValue = null
  if (rawValue !== null && rawValue !== undefined) {
    try {
      storedValue = JSON.parse(rawValue)
    } catch {
      // Unreadable value - fall back to the default rather than breaking the store.
      storedValue = null
    }
  }

  const data = ref(storedValue ?? initialValue)
  refs.set(key, data)
  watch(data, (value) => {
    if (receivedValues.has(toRaw(value))) {
      return
    }
    const rawValue = JSON.stringify(value)
    write(key, rawValue)
    channel?.postMessage({ key, rawValue })
  })

  return data
}
