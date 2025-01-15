import { deepSignal } from "alien-deepsignals"
import { Field } from "../controls/field"
import { METADATA_PROP } from "./metaKeys"
import { useOrCreateMetaData } from "./utils/setMetaData"

export function Prop<T>() {
  return function (_target: any, ctx: ClassFieldDecoratorContext) {
    const meta = useOrCreateMetaData(ctx, METADATA_PROP, [])
    let ref = deepSignal({ value: undefined as T })
    function set(this: Field, data: any) {
      ref.value = data
    }
    function get() {
      return ref.value
    }
    const propertyDescriptor: PropertyDescriptor = {
      configurable: true,
      enumerable: true,
      get,
      set
    }
    meta.push(ctx.name)
    ctx.addInitializer(function () {
      Object.defineProperty(this, ctx.name, propertyDescriptor)
    })
    return function (this: Field, initValue: T) {
      set.call(this, initValue)
      return initValue
    }
  }
}
