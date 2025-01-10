import { Field } from "../controls/field";
export function Provide(key?: string) {
  return function (_target: any, ctx: ClassFieldDecoratorContext) {
    return function (this: Field, initValue: any) {
      (this as Field).provides[key || ctx.name] = initValue
      return initValue
    }
  }
}
