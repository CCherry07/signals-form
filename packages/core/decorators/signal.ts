import { signal } from "alien-deepsignals";
export function Signal(_target: any, ctx: ClassFieldDecoratorContext) {
  const prop = signal(undefined);
  ctx.addInitializer(function () {
    Object.defineProperty(this, ctx.name, {
      get: prop.get,
      set: prop.set
    });
  })
  return function (initValue: any) {
    prop.set(initValue);
    return initValue;
  }
}
