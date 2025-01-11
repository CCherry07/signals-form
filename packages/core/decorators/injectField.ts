import {METADATA_INJECTFIELD} from "./metaKeys";

export function InjectField(depsMap: Record<string, string>) {
    return function (_target: any, ctx: ClassFieldDecoratorContext) {
        ctx.metadata![METADATA_INJECTFIELD] = depsMap;
    };
}
