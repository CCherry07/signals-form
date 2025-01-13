import { emitter } from "../emitter";
import { METADATA_IGNORE } from "./metaKeys";
import { useOrCreateMetaData } from "./utils/setMetaData";

export function SubscribeData(name: string) {
  return function (method: any, ctx: ClassMethodDecoratorContext) {
    const ignoreMeta = useOrCreateMetaData(ctx, METADATA_IGNORE, [])
    ignoreMeta.push(ctx.name);
    ctx.addInitializer(function () {
      emitter.on(name, method.bind(this));
    })
  };
}
