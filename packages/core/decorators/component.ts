import { Decision } from "../boolless";
import { Field } from "../controls/field";
import { METADATA_COMPONENT, METADATA_IGNORE } from "./metaKeys";
import { useOrCreateMetaData } from "./utils/setMetaData";

export interface ComponentMetaData {
  id: string;
  component?: any;
  hidden?: Decision;
  disabled?: Decision;
  recoverValueOnHidden?: boolean
  recoverValueOnShown?: boolean
  properties?: (typeof Field)[]
}
export function Component(metadata: ComponentMetaData) {
  return function (_target: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_COMPONENT] = metadata
    const meta = useOrCreateMetaData(ctx, METADATA_IGNORE, [])
    meta.push(...Object.keys(metadata ?? {}))
  };
}
