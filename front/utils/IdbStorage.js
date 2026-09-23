import { ref, toRaw, watch } from 'vue'

const DB_NAME = 'firefly-pico'
const STORE_NAME = 'keyval'

// Raw values read by preloadIdbStorage(), since the stores read their lists synchronously on setup
const cache = new Map()
let hasIndexedDb = false
let databasePromise = null

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('firefly-pico-storage')
const refs = new Map()
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
  databasePromise ??= new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1)
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
    const requests = action(transaction.objectStore(STORE_NAME))
    transaction.oncomplete = () => resolve(requests)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

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
      return
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      return
    }
  },
}

export async function preloadIdbStorage() {
  const database = await openDatabase()
  if (!database) {
    return
  }

  try {
    const [keys, values] = await runTransaction(database, 'readonly', (store) => [store.getAllKeys(), store.getAll()])
    keys.result.forEach((key, index) => cache.set(key, values.result[index]))
    hasIndexedDb = true
  } catch {
    cache.clear()
  }
}

function write(key, rawValue) {
  if (!hasIndexedDb) {
    legacyStorage.setItem(key, rawValue)
    return
  }

  cache.set(key, rawValue)
  openDatabase().then((database) => runTransaction(database, 'readwrite', (store) => store.put(rawValue, key)).catch(() => {}))
}

function read(key) {
  if (!hasIndexedDb) {
    return legacyStorage.getItem(key)
  }

  if (cache.has(key)) {
    return cache.get(key)
  }

  // Migrate lists stored in localStorage by older versions
  const legacyValue = legacyStorage.getItem(key)
  if (legacyValue !== null) {
    write(key, legacyValue)
    legacyStorage.removeItem(key)
  }
  return legacyValue
}

// Only whole-value replacements are persisted (shallow watch), which is how every store updates its lists
export function useIdbStorage(key, initialValue) {
  let storedValue = null
  try {
    storedValue = JSON.parse(read(key))
  } catch {
    storedValue = null
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
