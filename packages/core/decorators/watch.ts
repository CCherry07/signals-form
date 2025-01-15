import { effect } from "alien-signals";
import { METADATA_WATCH } from "./metaKeys";
import { computed } from "alien-deepsignals";
import { toValue } from "@rxform/shared";
export function Watch(deps: string| string[]) {
  if (typeof deps === "string") {
    deps = [deps]
  }
  return function (
    method: Function,
    ctx: ClassMethodDecoratorContext
  ) {
    const meta: Record<string | symbol, any> = ctx.metadata![METADATA_WATCH] ??= {};
    meta[ctx.name] = method;
    let oldValue = null as any
    ctx.addInitializer(function (this: any) {
      effect(() => {
        const depValues = computed(() => {
          return deps.map(dep => toValue(this[dep]))
        })
        effect(() => {
          method.call(this, depValues.value, oldValue);
          oldValue = depValues.currentValue
        }).stop()
      })
    })
  }
}
