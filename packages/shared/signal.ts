import { ReadonlySignal, Signal } from "@preact/signals-core";
import { isFunction } from "./utils";

export type MaybeSignal<T = any> =
  | T
  | Signal<T>

export type MaybeSignalOrGetter<T = any> = MaybeSignal<T> | ReadonlySignal<T> | (() => T)

export function isSignal<T>(v: MaybeSignal<T>): v is Signal<T> {
  return v instanceof Signal;
}

export function unSignal<T>(signal: MaybeSignal<T> | ReadonlySignal<T>): T {
  return isSignal(signal) ? signal.value : signal
}

export function toValue<T>(source: MaybeSignalOrGetter<T>): T {
  return isFunction(source) ? source() : unSignal(source);
}

export function toDeepValue<T>(source: MaybeSignalOrGetter<T>): T {
  if (isFunction(source)) {
    return toDeepValue(source());
  } else if (isSignal(source)) {
    return toDeepValue(source.value);
  } else if (Array.isArray(source)) {
    return source.map(toDeepValue) as T; 
  } else if (typeof source === 'object' && source !== null) {
    return Object.keys(source).reduce((acc, key) => {
      // @ts-ignore
      acc[key] = toDeepValue(source[key]);
      return acc;
    }, {} as Record<string, any>) as T;
  } else {
    return source;
  }
}
