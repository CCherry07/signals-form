import { deepSignal } from "alien-deepsignals"
import { toValue, type MaybeSignalOrComputedOrGetter } from "./signal";
export function ref<T>(getter: MaybeSignalOrComputedOrGetter) {
  return deepSignal({ value: toValue(getter) as T });
}
