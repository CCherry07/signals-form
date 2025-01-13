import { METADATA_EVENT } from "./metaKeys";
import { useOrCreateMetaData } from "./utils/setMetaData";

export function Event(): Function {
  return function (_method: any, ctx: ClassMethodDecoratorContext) {
    const meta = useOrCreateMetaData(ctx, METADATA_EVENT, [])
    meta.push(ctx.name);
  };
}
