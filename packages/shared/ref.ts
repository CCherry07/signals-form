import { deepSignal, MaybeSignalOrGetter, toValue } from "alien-deepsignals"
export function ref<T>(getter: MaybeSignalOrGetter) {
  return deepSignal({ value: toValue(getter) as T });
}
