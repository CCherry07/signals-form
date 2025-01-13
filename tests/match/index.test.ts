import { match, js, _ } from "@rxform/core"
import { expect, describe, it } from "vitest"

describe("match", () => {
  it("should match value with pattern", () => {
    const value = { type: 'user', name: 'Alice', age: 30 };
    const result = match(value, [
      [{ type: 'admin' }, () => 'Matched admin'],
      [{ type: 'user', age: js`value > 18` }, () => 'Matched adult user'],
      [{ type: 'user', age: (age) => age <= 18 }, () => 'Matched minor user'],
      [/^hello/, () => 'Matched pattern starting with hello'],
      [js`value.length > 3`, () => 'Matched string with length > 3'],
      [_, () => 'Default case']
    ]);

    expect(result).toMatchInlineSnapshot(`"Matched adult user"`);
  })

  it("should match array value with pattern", () => {
    const arrayValue = [1, 2, 3];
    const arrayResult = match(arrayValue, [
      [[1, 2, 3], () => 'Matched array [1, 2, 3]'],
      [_, () => 'Default case']
    ]);

    expect(arrayResult).toMatchInlineSnapshot(`"Matched array [1, 2, 3]"`);
  })

  it("should match map value with pattern", () => {
    const mapValue = new Map([['key1', 'value1'], ['key2', 'value2']]);
    const mapResult = match(mapValue, [
      [new Map([['key1', 'value1'], ['key2', 'value2']]), () => 'Matched map'],
      [_, () => 'Default case']
    ]);

    expect(mapResult).toMatchInlineSnapshot(`"Matched map"`);
  })

  it("should match set value with pattern", () => {
    const setValue = new Set([1, 2, 3]);
    const setResult = match(setValue, [
      [new Set([1, 2, 3]), () => 'Matched set'],
      [_, () => 'Default case']
    ]);

    expect(setResult).toMatchInlineSnapshot(`"Matched set"`);
  })

  it("not match object value with pattern", () => {
    const value = { type: 'user', name: 'Alice', age: 30 };
    const result = match(value, [
      [{ type: 'admin' }, () => 'Matched admin'],
      [_, () => 'Default case']
    ]);

    expect(result).toMatchInlineSnapshot(`"Default case"`);
  });

  it('test basic type matching', () => {
    const result = match(1, [
      [1, () => 'Matched 1'],
      [2, () => 'Matched 2'],
      [_, () => 'Default case']
    ]);

    expect(result).toMatchInlineSnapshot(`"Matched 1"`);

    const result2 = match('hello', [
      ['hello', () => 'Matched hello'],
      [_, () => 'Default case']
    ]);
    expect(result2).toMatchInlineSnapshot(`"Matched hello"`);

    const result3 = match(true, [
      [true, () => 'Matched true'],
      [false, () => 'Matched false'],
      [_, () => 'Default case']
    ]);
    expect(result3).toMatchInlineSnapshot(`"Matched true"`);

    const result4 = match(null, [
      [null, () => 'Matched null'],
      [_, () => 'Default case']
    ]);
    
    expect(result4).toMatchInlineSnapshot(`"Matched null"`);


    const result5 = match(undefined, [
      [undefined, () => 'Matched undefined'],
      [_, () => 'Default case']
    ]);

    expect(result5).toMatchInlineSnapshot(`"Matched undefined"`);

    const symbol = Symbol('symbol');
    const result6 = match(symbol, [
      [Symbol('symbol'), () => 'Matched symbol'],
      [_, () => 'Default case']
    ]);
    expect(result6).toMatchInlineSnapshot(`"Default case"`);
    const result7 = match(symbol, [
      [symbol, () => 'Matched symbol'],
      [_, () => 'Default case']
    ]);

    expect(result7).toMatchInlineSnapshot(`"Matched symbol"`);

    const result8 = match({}, [
      [{}, () => 'Matched object'],
      [_, () => 'Default case']
    ]);

    expect(result8).toMatchInlineSnapshot(`"Matched object"`);
  });
})
