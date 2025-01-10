import { Decision } from "../boolless";
import { Field } from "../controls/field";
import { METADATA_COMPONENT } from "./metaKeys";

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
  };
}
