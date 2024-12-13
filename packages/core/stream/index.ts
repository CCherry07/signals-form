import { rx, reduce, filter, map, UnaryFunction, of } from "rxjs";
import { BoolValues, Decision } from "../boolless";
import { Filed } from "../controls/fieldControl";
import { DecoratorInject } from "../controls/decorator";
import { isFunction } from "@rxform/shared";

export type Step = {
  effect?: (this: Filed & DecoratorInject, info: any) => void;
  operator?: "if" | "ifelse" | "any" | 'switch';
  decision?: Decision;
  do?: Step[];
  value?: any;
  pipe?: Array<UnaryFunction<any, any>>;
};

export function run(this: Filed & DecoratorInject, flow: Step[], source: any, bools: BoolValues, context: any) {
  return rx(flow).pipe(reduce((acc, step) => {
    let data = acc
    const { effect, operator, decision, pipe } = step
    if (pipe) {
      // @ts-ignore
      of(data).pipe(...pipe).subscribe((v) => {
        data = v
      })
    }

    if (operator === "if") {
      if (decision?.evaluate(bools)) {
        run.call(this, step.do!, data, bools, context).subscribe()
      }
    }

    if (operator === "ifelse") {
      if (decision?.evaluate(bools)) {
        run.call(this, step.do!, data, bools, context).subscribe()
      } else {
        run.call(this, step.value!, data, bools, context).subscribe()
      }
    }

    if (operator === "switch") {
      const res = step.do!.find((step) => step.decision?.evaluate(bools))
      if (res) {
        run.call(this, res.do!, data, bools, context).subscribe()
      }
    }

    if (operator === "any") {
      rx(step.do!).pipe(
        filter((step) => !!step.decision?.evaluate(bools)),
        map((step) => step.do)
      ).subscribe(
        {
          next: (v) => {
            run.call(this, v!, data, bools, context).subscribe()
          },
          complete() {
            console.log("any operator completed")
          },
        }
      )
    }
    if (isFunction(effect) && (decision ? decision.evaluate(bools) : true)) {
      effect.call(this, data)
    }
    return data
  }, source))
}
