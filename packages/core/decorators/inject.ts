import { METADATA_IGNORE, METADATA_INJECT } from "./metaKeys";
import { Field } from "../controls/field";
import { isArray, isObject, isString } from "@rxform/shared";
import { useOrCreateMetaData } from "./utils/setMetaData";

export function Inject(deps?: string[] | Record<string, string> | string) {
  return function (_target: any, ctx: ClassFieldDecoratorContext) {
    const meta: Record<string | symbol, any> = ctx.metadata![METADATA_INJECT] ??= [];
    const ignoreMeta = useOrCreateMetaData(ctx, METADATA_IGNORE, [])
    ignoreMeta.push(ctx.name);
    const inject = function (this: Field) {
      const provides = {
        ...this.appContext.provides,
        ...this.parent!.provides,
      }
      let injectValues = undefined
      if (isArray(deps)) {
        injectValues = deps.map((dep: string) => provides[dep])
      } else if (isObject(deps)) {
        injectValues = Object.fromEntries(Object.entries(deps).map(([key, dep]) => {
          return [key, provides[dep as string]]
        }))
      } else if (isString(deps)) {
        injectValues = provides[deps]
      } else {
        injectValues = provides
      }
      // @ts-ignore
      return this[ctx.name] = injectValues ?? this[ctx.name]
    }
    meta.push(inject);
  }
}
