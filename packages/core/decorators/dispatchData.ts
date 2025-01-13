import { emitter } from "../emitter";
import { METADATA_IGNORE } from "./metaKeys";
import { useOrCreateMetaData } from "./utils/setMetaData";

export function DispatchData<T>(name: string, immediate: boolean = true): Function {
  return function (_target: any, ctx: ClassFieldDecoratorContext) {
    let value: any = undefined
    const getter = function () {
      return value;
    };
    const setter = function (data: any) {
      value = data;
      emitter.emit(name, value);
    }
    ctx.addInitializer(function () {
      Object.defineProperty(this, ctx.name, {
        get: getter,
        set: setter
      })
    })
    const meta = useOrCreateMetaData(ctx, METADATA_IGNORE, [])
    meta.push(ctx.name);
    return (initValue: T) => {
      if (immediate) setter(initValue)
      else value = initValue
    }
  };
}
