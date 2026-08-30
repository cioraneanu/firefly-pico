export async function mapWithConcurrency(items, worker, { concurrency = 4, onSettled = null } = {}) {
  if (!items || items.length === 0) return []

  const results = new Array(items.length)
  let nextIndex = 0
  const poolSize = Math.max(1, Math.min(concurrency, items.length))

  async function runLane() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      const item = items[index]
      let value, error
      try {
        value = await worker(item, index)
      } catch (e) {
        error = e ?? new Error('mapWithConcurrency: worker threw a falsy value')
      }
      const settled = { item, value: error ? undefined : value, error: error ?? null, index }
      results[index] = settled
      if (onSettled) {
        try {
          onSettled(settled)
        } catch {
          // A buggy progressive-render callback must not break the pool's "never rejects" guarantee.
        }
      }
    }
  }

  await Promise.all(Array.from({ length: poolSize }, runLane))
  return results
}
