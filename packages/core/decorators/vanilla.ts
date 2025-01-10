import { METADATA_VANILLA } from "./metaKeys";
/**
 * 原生装饰器, 用于装饰组件的属性,不会传递给组件的props
 * @param metadata
 * @returns
 */
export function Vanilla(_target: any, ctx: ClassFieldDecoratorContext) {
  const meta: Record<string | symbol, any> = ctx.metadata![METADATA_VANILLA] ??= {};
  meta[ctx.name] = undefined;
  return function (initValue: any) {
    meta[ctx.name] = initValue;
  };
}
