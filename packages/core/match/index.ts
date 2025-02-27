import { createTemplateLiterals as js } from "@signals-form/shared";
import { isFunction, isMap, isPlainObject, isRegExp, isSet, isString } from "alien-deepsignals";

type Pattern<T> = T | RegExp | ((value: T) => boolean) | { [K in keyof T]?: Pattern<T[K]> } | string;

export const _ = Symbol('_');

class Matcher<T, R> {
  private value: T;
  private patterns: Array<[Pattern<T> | typeof _, (value?: T) => R]> = [];

  constructor(value: T) {
    this.value = value;
  }

  when(pattern: Pattern<T> | typeof _, handler: (value?: T) => R): this {
    this.patterns.push([pattern, handler]);
    return this;
  }

  private match(): R {
    for (const [pattern, handler] of this.patterns) {
      switch (true) {
        case pattern === _:
          return handler(this.value);
        case isFunction(pattern) && (pattern as (value: T) => boolean)(this.value):
          return handler(this.value);
        case isRegExp(pattern) && isString(this.value) && pattern.test(this.value):
          return handler(this.value);
        case Array.isArray(pattern) && Array.isArray(this.value) && matchArray(this.value, pattern):
          return handler(this.value);
        case isMap(pattern) && isMap(this.value) && matchMap(this.value, pattern):
          return handler(this.value);
        case isSet(pattern) && isSet(this.value) && matchSet(this.value, pattern):
          return handler(this.value);
        case isPlainObject(pattern) && isPlainObject(this.value) && matchObject(this.value, pattern as Object):
          return handler(this.value);
        case pattern === this.value:
          return handler(this.value);
      }
    }
    throw new Error(`No match found for value: ${JSON.stringify(this.value)}, The part that does not need to be matched can be replaced by otherwise`);
  }

  otherwise(handler: (value?: T) => R): R {
    this.patterns.push([_, handler]);
    return this.match();
  }

  exhaustive(): R {
    if (this.patterns.length === 0) {
      return this.value as unknown as R;
    }
    return this.match();
  }
}

export function match<T>(value: T): Matcher<T, any> {
  return new Matcher(value);
}

function matchObject<T>(value: T, pattern: { [K in keyof T]?: Pattern<T[K]> }): boolean {
  for (const key in pattern) {
    if (pattern.hasOwnProperty(key)) {
      const patternValue = pattern[key];
      const targetValue = value[key];
      if (
        !match(targetValue)
          .when(patternValue!, () => true)
          .otherwise(() => false)
      ) {
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
    if (!match(value[i]).when(pattern[i], () => true).otherwise(() => false)) {
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
    if (
      !value.has(key) || !match(val as V)
        .when(patternValue, () => true)
        .otherwise(() => false)
    ) {
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

export {
  js
}
