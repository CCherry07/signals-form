import { Field } from "../controls/field";
import { METADATA_IGNORE } from "./metaKeys";
import { useOrCreateMetaData } from "./utils/setMetaData";
export function Provide(key?: string) {
  return function (_target: any, ctx: ClassFieldDecoratorContext) {
    const ignoreMeta = useOrCreateMetaData(ctx, METADATA_IGNORE, [])
    ignoreMeta.push(ctx.name);
    return function (this: Field, initValue: any) {
      (this as Field).provides[key || ctx.name] = initValue
      return initValue
    }
  }
}
