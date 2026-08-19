import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useServerSyncedForm } from "./use-server-synced-form"

type Profile = { name: string; bio: string }

const render = (initial: Profile, initialFrozen = false, initialUserId = "u1") =>
  renderHook(
    ({ values, frozen, userId }: { values: Profile; frozen: boolean; userId: string }) =>
      useServerSyncedForm(values, { frozen, identity: userId }),
    { initialProps: { values: initial, frozen: initialFrozen, userId: initialUserId } },
  )

describe("useServerSyncedForm", () => {
  it("seeds from the server values", () => {
    const { result } = render({ name: "Ray", bio: "hi" })
    expect(result.current.values).toEqual({ name: "Ray", bio: "hi" })
  })

  it("re-seeds when the server values change", () => {
    const { result, rerender } = render({ name: "Ray", bio: "hi" })
    rerender({ values: { name: "Ramon", bio: "hi" }, frozen: false, userId: "u1" })
    expect(result.current.values).toEqual({ name: "Ramon", bio: "hi" })
  })

  it("holds in-progress edits while frozen", () => {
    const { result, rerender } = render({ name: "Ray", bio: "hi" }, true)
    act(() => result.current.setValues({ name: "typing", bio: "hi" }))
    rerender({ values: { name: "Ramon", bio: "hi" }, frozen: true, userId: "u1" })
    expect(result.current.values).toEqual({ name: "typing", bio: "hi" })
  })

  it("does not re-seed after unfreezing when the server has not moved", () => {
    const { result, rerender } = render({ name: "Ray", bio: "hi" }, true)
    act(() => result.current.setValues({ name: "saved", bio: "hi" }))
    rerender({ values: { name: "Ray", bio: "hi" }, frozen: false, userId: "u1" })
    expect(result.current.values).toEqual({ name: "saved", bio: "hi" })
  })

  it("picks up the server change that lands after unfreezing", () => {
    const { result, rerender } = render({ name: "Ray", bio: "hi" }, true)
    act(() => result.current.setValues({ name: "saved", bio: "hi" }))
    rerender({ values: { name: "saved", bio: "hi" }, frozen: false, userId: "u1" })
    rerender({ values: { name: "saved", bio: "edited elsewhere" }, frozen: false, userId: "u1" })
    expect(result.current.values).toEqual({ name: "saved", bio: "edited elsewhere" })
  })

  it("re-seeds for a different user even when the fields match", () => {
    const { result, rerender } = render({ name: "", bio: "" })
    act(() => result.current.setValues({ name: "typed", bio: "" }))
    rerender({ values: { name: "", bio: "" }, frozen: false, userId: "u2" })
    expect(result.current.values).toEqual({ name: "", bio: "" })
  })

  it("reset re-seeds on demand, even from frozen", () => {
    const { result } = render({ name: "Ray", bio: "hi" }, true)
    act(() => result.current.setValues({ name: "typing", bio: "hi" }))
    act(() => result.current.reset())
    expect(result.current.values).toEqual({ name: "Ray", bio: "hi" })
  })
})
