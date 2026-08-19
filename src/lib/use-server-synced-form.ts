import { useState } from "react"

/**
 * Keeps a form in sync with server values, without an effect.
 *
 * The form re-seeds whenever the server values change (the live query resolving
 * after mount, or another tab writing a change) and whenever `identity` changes,
 * so a different user never inherits the previous one's form. It holds still
 * while `frozen` is true so in-progress edits don't get clobbered. `reset`
 * re-seeds on demand, which is what a cancel button wants.
 */
export function useServerSyncedForm<T extends Record<string, string>>(
  serverValues: T,
  { frozen, identity = "" }: { frozen: boolean; identity?: string },
) {
  const key = `${identity} ${JSON.stringify(serverValues)}`
  const [values, setValues] = useState(serverValues)
  const [syncedKey, setSyncedKey] = useState(key)

  if (!frozen && syncedKey !== key) {
    setSyncedKey(key)
    setValues(serverValues)
  }

  const reset = () => {
    setSyncedKey(key)
    setValues(serverValues)
  }

  return { values, setValues, reset }
}
