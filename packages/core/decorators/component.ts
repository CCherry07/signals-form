import { Decision } from "../boolless";
import { Field } from "../controls/field";
import { METADATA_COMPONENT } from "./metaKeys";

export interface ComponentMetaData {
  id: string;
  component?: any;
  hidden?: Decision;
  disabled?: Decision;
  props?: Record<string, any>;
  recoverValueOnHidden?: boolean
  recoverValueOnShown?: boolean
  properties?: (typeof Field | Field)[]
}
export function Component(metadata: ComponentMetaData) {
  return function (_constructor: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_COMPONENT] = metadata
  };
}
