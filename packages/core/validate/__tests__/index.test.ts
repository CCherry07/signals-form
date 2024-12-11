import { validate, type ValidateItem } from ".."
import { z } from "zod"
import { describe, it, expect } from "vitest"
import { D, MaybeSignal, setup, toValue } from "../../boolless"
import { ReadonlySignal, signal } from "@preact/signals-core"

const context = signal({
  name: signal('cherry'),
  age: signal(18),
  addr: signal({
    city: signal('重庆')
  }),
  d: signal('dd'),
  userInfo: signal({ name: signal('Tom'), age: signal(18) })
})

type Context = typeof context

const bools = {
  isD: (context: MaybeSignal<Context>) => toValue(context).d.value === 'd',
  isTom: (context: MaybeSignal<Context>) => toValue(context).userInfo.value.name.value === 'Tom',
}

const boolValues = setup(bools, context) as Record<keyof typeof bools, ReadonlySignal<boolean>>;

describe("validate", () => {
  const rules: ValidateItem[] = [
    {
      schema: z.object({
        name: z.string(),
        age: z.number(),
        addr: z.object({
          city: z.string()
        })
      })
    }
  ]

  it("validate success", async () => {
    const result = await validate({
      value: {
        name: "cherry",
        age: 18,
        addr: {
          city: '重庆'
        }
      },
      event: "change"
    }, rules, boolValues, context)
    expect(result).toMatchInlineSnapshot(`{}`)
  })

  it("validate fail", async () => {
    const result = await validate({
      value: {
        name: "cherry",
        age: "18",
        addr: {
          city: '重庆'
        }
      },
      event: "change"
    }, rules, boolValues, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "age": {
          "message": "Expected number, received string",
          "type": "invalid_type",
        },
      }
    `)
  })

  it('fact success', async () => {
    const rules: ValidateItem[] = [
      {
        fact: {
          userInfo: {
            name: "$.value.userInfo.value.name.value",
            age: "$.value.userInfo.value.age.value"
          }
        },
        schema: z.object({
          value: z.object({
            name: z.string(),
            age: z.number(),
            addr: z.object({
              city: z.string()
            })
          }),
          userInfo: z.object({
            name: z.string(),
            age: z.number(),
          })
        })
      }
    ]

    const result = await validate({
      value: {
        name: "cherry",
        age: 18,
        addr: {
          city: '重庆'
        }
      },
      event: "change"
    }, rules, boolValues, context)
    expect(result).toMatchInlineSnapshot(`{}`)
  })

  it("needValidate", async () => {
    const rules: ValidateItem[] = [
      {
        needValidate: D.not("isTom"),
        schema: z.object({
          name: z.string(),
          age: z.number(),
          addr: z.object({
            city: z.string()
          })
        })
      }
    ]
    const result = await validate({
      value: {
        name: "cherry",
        age: 18,
        addr: {
          city: '重庆'
        }
      },
      event: "change"
    }, rules, boolValues, context)
    expect(result).toMatchInlineSnapshot(`{}`)
  })
})
