import { emitter } from "../emitter";

export function SubscribeData(name: string) {
  return function (method: any, ctx: ClassMethodDecoratorContext) {
    ctx.addInitializer(function () {
      console.log("SubscribeData", name);
      emitter.on(name, method.bind(this));
    })
  };
}
