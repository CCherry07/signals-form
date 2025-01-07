import { METADATA_PROPS } from "./metaKeys";

export interface PropsMetaData {
  [key: string]: any;
}

export function Props(metadata: PropsMetaData) {
  return function (_target: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_PROPS] = metadata
  };
}
