import { validate, type ValidateItem } from "@signals-form/core"
import { zodResolver } from "@signals-form/resolvers"
import { z } from "zod"
import { describe, it, expect } from "vitest"
import { D, setup } from "../../packages/core/boolless"
import { deepSignal } from "alien-deepsignals"

const validatorResolvers = {
  zod: zodResolver
}
const context = deepSignal({
  name: 'cherry',
  age: 18,
  addr: {
    city: ('重庆')
  },
  d: 'dd',
  userinfo: { name: ('Tom'), age: (18) }
})

type Context = typeof context

const bools = {
  isD: (context: Context) => context.d === 'd',
  isTom: (context: Context) => context.userinfo.name === 'Tom',
} as const
const boolContext = setup(bools, context)

const execDecision = (decision: any) => decision.evaluate(boolContext)

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
      updateOn: "change",
      defaultValidatorEngine: "zod",
      model: context,
      execDecision
    }, rules, validatorResolvers)
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
      updateOn: "change",
      defaultValidatorEngine: "zod",
      model: context,
      execDecision
    }, rules, validatorResolvers)

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
        fact: () => ({
          value: {
            name: "cherry",
            age: 18,
            addr: {
              city: '重庆'
            }
          },
          userinfo: {
            addr: "朝阳区",
            name: context.userinfo.name,
            age: context.userinfo.age
          }
        }),
        schema: z.object({
          value: z.object({
            name: z.string(),
            age: z.number(),
            addr: z.object({
              city: z.string()
            })
          }),
          userinfo: z.object({
            name: z.string(),
            age: z.number(),
            addr: z.string()
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
      updateOn: "change",
      defaultValidatorEngine: "zod",
      model: context,
      execDecision
    }, rules, validatorResolvers)
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
      updateOn: "change",
      defaultValidatorEngine: "zod",
      model: context,
      execDecision
    }, rules, validatorResolvers)
    expect(result).toMatchInlineSnapshot(`{}`)
  })
})
