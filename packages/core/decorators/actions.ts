import type { Field } from "../controls/field";
import { METADATA_ACTIONS } from "./metaKeys";

export interface TransferMetaData<T, D> {
  setDefaultValue?: (this: Field, model: T) => D
  onSubmitValue?: (this: Field, data: D) => T
};
export function Actions<T, D>(metadata: TransferMetaData<T, D>) {
  return function (_target: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_ACTIONS] = metadata
  };
}
