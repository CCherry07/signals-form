import { rx, reduce, filter, map, pipe, UnaryFunction, of } from "rxjs";
import operators from "rxjs/operators";
import { BoolValues, Decision } from "../boolless";
import { Field, Filed } from "../controls/fieldControl";

export type Step = {
  effect?: (this: Field, info: any) => void;
  operator?: "toggle" | "onlyone" | "any" | "single";
  decision?: Decision;
  do?: Step[];
  value?: any;
  pipe?: Array<UnaryFunction<any, any>>;
};

export function run(this: Filed, flow: Step[], source: any, bools: BoolValues, context: any) {
  return rx(flow).pipe(reduce((acc, step) => {
    let data = acc
    const { effect, operator, decision, do: _do, value, pipe } = step
    if (pipe) {
      // @ts-ignore
      of(data).pipe(...pipe).subscribe((v) => {
        data = v
      })
    }

    if (step.effect && !step.operator) {
      step.effect.call(this, data)
    }

    if (step.operator === "onlyone") {
      const res = step.do!.find((step) => step.decision?.evaluate(bools))
      if (res) {
        run.call(this, res.do!, data, bools, context).subscribe()
      }
    }

    if (step.operator === "any") {
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
    return data
  }, source))
}
