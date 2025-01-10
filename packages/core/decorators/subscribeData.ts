import { emitter } from "../emitter";

export function SubscribeData(name: string) {
  return function (method: any, ctx: ClassMethodDecoratorContext) {
    ctx.addInitializer(function () {
      emitter.on(name, method.bind(this));
    })
  };
}
