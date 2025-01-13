import type { Field } from "../controls/field";
import { METADATA_ACTIONS, METADATA_IGNORE } from "./metaKeys";
import { useOrCreateMetaData } from "./utils/setMetaData";

export interface TransferMetaData<T, D> {
  setDefaultValue?: (this: Field, model: T) => D
  onSubmitValue?: (this: Field, data: D) => T
};
export function Actions<T, D>(metadata: TransferMetaData<T, D>) {
  return function (_target: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_ACTIONS] = metadata
    const meta = useOrCreateMetaData(ctx, METADATA_IGNORE, [])
    meta.push('actions')
  };
}
