import { rx, reduce, filter, map, UnaryFunction, of } from "rxjs";
import { BoolValues, Decision } from "../boolless";
import { Field } from "../controls/field";
import { isFunction } from "@rxform/shared";

export type Step = {
  effect?: (this: Field, info: any) => void;
  operator?: "if" | "ifelse" | "any" | 'switch';
  decision?: Decision;
  do?: Step[] | [Step[], Step[]];
  value?: any;
  pipe?: Array<UnaryFunction<any, any>>;
};

export function run(this: Field, flow: Step[], source: any, bools: BoolValues, context: any) {
  return rx(flow).pipe(reduce((acc, step) => {
    let data = acc
    const { effect, operator, decision, pipe, do: stepToDo } = step
    if (pipe) {
      // @ts-ignore
      of(data).pipe(...pipe).subscribe((v) => {
        data = v
      })
    }

    if (operator === "if") {
      if (decision?.evaluate(bools)) {
        run.call(this, stepToDo as Step[], data, bools, context).subscribe()
      }
    }

    if (operator === "ifelse") {
      if (decision?.evaluate(bools)) {
        // @ts-ignore
        run.call(this, step.do![0], data, bools, context).subscribe()
      } else {
        // @ts-ignore
        run.call(this, step.do![1], data, bools, context).subscribe()
      }
    }

    if (operator === "switch") {
      const res = (stepToDo as Step[])!.find((step) => step.decision?.evaluate(bools))
      if (res) {
        run.call(this, res.do as Step[], data, bools, context).subscribe()
      }
    }

    if (operator === "any") {
      rx((stepToDo as Step[])!).pipe(
        filter((step) => !!step.decision?.evaluate(bools)),
        map((step) => step.do)
      ).subscribe(
        {
          next: (v) => {
            run.call(this, v as Step[], data, bools, context).subscribe()
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
