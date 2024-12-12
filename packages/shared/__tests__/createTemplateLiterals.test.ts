import { describe, expect, it } from "vitest";
import { createTemplateLiterals } from "../createTemplateLiterals"

describe('createTemplateLiterals', () => {
  it('should return a function', () => {
    const state = { foo: 'bar' };
    const context = { baz: 'qux' };
    const js = createTemplateLiterals(state, context);
    expect(typeof js).toBe('function');
  });
  it('should return the correct value when given a string', () => {
    const state = { foo: 'bar' };
    const context = { baz: 'qux' };
    const js = createTemplateLiterals(state, context);

    const result = js`$state.foo`;
    expect(result).toBe('bar');
  })
})
