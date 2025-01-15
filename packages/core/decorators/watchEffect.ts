import { effect } from "alien-signals";
import { METADATA_WATCH_EFFECT } from "./metaKeys";
export function WatchEffect(
  method: Function,
  ctx: ClassMethodDecoratorContext
) {
  const meta: Record<string | symbol, any> = ctx.metadata![METADATA_WATCH_EFFECT] ??= {};
  meta[ctx.name] = method;
  ctx.addInitializer(function () {
    effect(() => {
      method.call(this);
    })
  })
}
