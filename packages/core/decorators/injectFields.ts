import { METADATA_IGNORE, METADATA_INJECTFIELD } from "./metaKeys";
import { useOrCreateMetaData } from "./utils/setMetaData";

export function InjectFields(depsMap: Record<string, string>) {
    return function (_target: any, ctx: ClassDecoratorContext) {
        const ignoreMeta = useOrCreateMetaData(ctx, METADATA_IGNORE, [])
        ignoreMeta.push("injectFields");
        ctx.metadata![METADATA_INJECTFIELD] = depsMap;
    };
}
