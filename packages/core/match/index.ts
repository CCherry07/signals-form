import { isObject, createTemplateLiterals as js } from "@rxform/shared";

export {
  js
}

type Pattern<T> = T | RegExp | ((value: T) => boolean) | { [K in keyof T]?: Pattern<T[K]> } | string;

export const _ = Symbol('_');

export function match<T, R>(value: T, patterns: Array<[Pattern<T> | typeof _, (value?: T) => R]>): R {
  for (const [pattern, handler] of patterns) {
  switch (true) {
      case pattern === _:
        return handler(value);
      case typeof pattern === 'function' && (pattern as (value: T) => boolean)(value):
        return handler(value);
      case pattern instanceof RegExp && typeof value === 'string' && pattern.test(value):
        return handler(value);
      case Array.isArray(pattern) && Array.isArray(value) && matchArray(value, pattern):
        return handler(value);
      case pattern instanceof Map && value instanceof Map && matchMap(value, pattern):
        return handler(value);
      case pattern instanceof Set && value instanceof Set && matchSet(value, pattern):
        return handler(value);
      case isObject(pattern) && isObject(value) && matchObject(value, pattern as Object):
        return handler(value);
      case pattern === value:
        return handler(value);
    }
  }
  throw new Error(`No match found for value: ${JSON.stringify(value)}, The part that does not need to be matched can be replaced by _`);
}

function matchObject<T>(value: T, pattern: { [K in keyof T]?: Pattern<T[K]> }): boolean {
  for (const key in pattern) {
    if (pattern.hasOwnProperty(key)) {
      const patternValue = pattern[key];
      const targetValue = value[key];
      if (!match(targetValue, [[patternValue, () => true], [_, () => false]])) {
        return false;
      }
    }
  }
  return true;
}

function matchArray<T>(value: T[], pattern: Pattern<T>[]): boolean {
  if (value.length !== pattern.length) {
    return false;
  }
  for (let i = 0; i < value.length; i++) {
    if (!match(value[i],
      [[pattern[i], () => true],
      [_, () => false]])) {
      return false;
    }
  }
  return true;
}

function matchMap<K, V>(value: Map<K, V>, pattern: Map<K, Pattern<V>>): boolean {
  if (value.size !== pattern.size) {
    return false;
  }
  for (const [key, patternValue] of pattern) {
    const val = value.get(key);
    if (!value.has(key) || !match(val as V, [[patternValue, () => true], [_, () => {
      return false
    }]])) {
      return false;
    }
  }
  return true;
}

function matchSet<T>(value: Set<T>, pattern: Set<Pattern<T>>): boolean {
  if (value.size !== pattern.size) {
    return false;
  }
  const valueArray = Array.from(value);
  const patternArray = Array.from(pattern);
  return matchArray(valueArray, patternArray);
}
