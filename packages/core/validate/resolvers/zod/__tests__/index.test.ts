import { z } from 'zod';
import { expect, describe, it } from "vitest"
import { zodResolver } from ".."

describe('zodResolver', () => {
    it('zodResolver is success', async () => {
        const schema = z.object({
            name: z.string(),
            age: z.number(),
        });
        const resolver = zodResolver(schema);
        const result = await resolver({
            name: 'John',
            age: 30,
        });
        expect(result).toEqual({
            errors: {},
            values: {
                name: 'John',
                age: 30,
            },
        });
    })

    it('zodResolver is failed', async () => {
        const schema = z.object({
            name: z.string(),
            age: z.number(),
            addr: z.object({
                city: z.string({ message: "addr.city is required and must be a string" })
            })
        });
        const resolver = zodResolver(schema);
        const result = await resolver({
            name: 'John',
            age: 30,
            addr: {
                city: 12
            }
        });
        expect(result).toEqual({
            errors: {
                "addr.city": {
                    message: "addr.city is required and must be a string",
                    type: "invalid_type"
                }
            },
            values: {},
        });
    })
})
