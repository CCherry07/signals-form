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
