import { effect } from "alien-signals";
import { Decision } from "../boolless";
import { Field } from "../controls/field";
import { METADATA_CONDITIONS, METADATA_IGNORE } from "./metaKeys";
import { useOrCreateMetaData } from "./utils/setMetaData";

export function Condition(decision: Decision): Function {
  return function (method: any, ctx: ClassMethodDecoratorContext) {
    const meta = useOrCreateMetaData(ctx, METADATA_IGNORE, [])
    meta.push(ctx.name);
      (ctx.metadata![METADATA_CONDITIONS] ??= {} as any)[ctx.name] = function (this: Field) {
        return effect(() => {
          if (this.evaluateDecision(decision)) {
            method.call(this);
          }
        });
      }
  };
}
