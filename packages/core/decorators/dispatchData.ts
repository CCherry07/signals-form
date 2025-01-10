import { emitter } from "../emitter";

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
    return (initValue: T) => {
      if (immediate) setter(initValue)
      else value = initValue
    }
  };
}
