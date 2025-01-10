import { ValidateItem } from "../validator";
import { METADATA_VALIDATOR } from "./metaKeys";
export interface ValidatorMetaData {
  signal?: Record<string, ValidateItem[]>;
  initiative?: Record<string, ValidateItem[]>;
}

export function Validator(metadata: ValidatorMetaData) {
  return function (_target: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_VALIDATOR] = metadata
  };
}
