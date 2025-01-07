import { METADATA_PROPS } from "./metaKeys";

export function Prop() {
  return function (_target: any, ctx: ClassFieldDecoratorContext) {
    const meta = (ctx.metadata![METADATA_PROPS] ??= {}) as Record<string | symbol, any>
    meta[ctx.name] = undefined
  };
}
