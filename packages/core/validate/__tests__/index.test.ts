import { validate, type ValidateItem } from ".."
import { z } from "zod"
import { describe, it, expect } from "vitest"

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
    }, rules, {})
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
    }, rules, {})

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
          a: "$.a",
          b: "$.user.b"
        },
        schema: z.object({
          value: z.object({
            name: z.string(),
            age: z.number(),
            addr: z.object({
              city: z.string()
            })
          }),
          a: z.number(),
          b: z.string()
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
    },
      rules,
      {
        a: 10,
        user: {
          b: "北京"
        }
      })
    expect(result).toMatchInlineSnapshot(`{}`)
  })
})
