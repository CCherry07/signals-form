import { set, setSignal } from "@signals-form/shared"
import { deepSignal, effect } from "alien-deepsignals"
import { describe, expect, it } from "vitest"
interface Store {
  a: {
    b: {
      c: number
    }
  }
}
describe("set", () => {
  it("should set value", () => {
    const store = deepSignal({} as Store)
    setSignal(store, "a.b.c", 1)
    expect(store.a.b.c).toBe(1)
  })

  it("should set value with nested object", () => {
    const store = deepSignal({} as Store)
    setSignal(store, "a.b", { c: 1 })
    expect(store.a.b.c).toBe(1)
  })

  it("should set value with effect", () => {
    const store = deepSignal({} as Store)
    let value = 0
    effect(() => {
      value = store?.a?.b?.c
    })
    setSignal(store, "a.b.c", 1)
    expect(value).toBe(1)
  })

  it("should lodash.set value with effect and nested object", () => {
    const store = deepSignal({
      a: {
        b: {
          c: 1,
        }
      },
    })

    effect(() => {
      set(store, "a.b.c", 2)
    })
    store.a.b.c = 3
    // Since lodash.set has getter side effects, the value here will also go through the effect once, so the value here is 2
    expect(store.a.b.c).toBe(2)
  })
  it("should setSignal value with effect and nested object", () => {
    const store = deepSignal({
      a: {
        b: {
          c: 1,
        }
      },
    })
    effect(() => {
      setSignal(store, "a.b.c", 2)
    })
    store.a.b.c = 3
    expect(store.a.b.c).toBe(3)
  })
})
