import { describe, it, expect } from 'vitest';
import { match, _ } from '@signals-form/core';

describe('Matcher', () => {
  it('should match exact value', () => {
    const result = match(42)
      .when(42, () => 'matched')
      .otherwise(() => 'not matched')
    expect(result).toBe('matched');
  });

  it('should match using function', () => {
    const result = match(42)
      .when((value) => value > 40, () => 'matched')
      .otherwise(() => 'not matched')
    expect(result).toBe('matched');
  });

  it('should match using RegExp', () => {
    const result = match('hello')
      .when(/hello/, () => 'matched')
      .otherwise(() => 'not matched')
    expect(result).toBe('matched');
  });

  it('should match using object pattern', () => {
    const result = match({ a: 1, b: 2 })
      .when({ a: 1 }, () => 'matched')
      .otherwise(() => 'not matched')
    expect(result).toBe('matched');
  });

  it('should match using array pattern', () => {
    const result = match([1, 2, 3])
      .when([1, 2, 3], () => 'matched')
      .otherwise(() => 'not matched')
    expect(result).toBe('matched');
  });

  it('should match using Map pattern', () => {
    const result = match(new Map([['a', 1], ['b', 2]]))
      .when(new Map([['a', 1], ['b', 2]]), () => 'matched')
      .otherwise(() => 'not matched')
    expect(result).toBe('matched');
  });

  it('should match using Set pattern', () => {
    const result = match(new Set([1, 2, 3]))
      .when(new Set([1, 2, 3]), () => 'matched')
      .otherwise(() => 'not matched')
    expect(result).toBe('matched');
  });

  it('should return default when no match found', () => {
    const result = match(42)
      .when(43, () => 'matched')
      .otherwise(() => 'not matched')
    expect(result).toBe('not matched');
  });
});
