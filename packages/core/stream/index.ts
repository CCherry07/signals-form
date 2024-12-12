import { rx, reduce, filter, map } from "rxjs"
import { BoolValues, Decision } from "../boolless"
import { Filed } from "../controls/fieldControl"

export interface Step {
  map?: (value: any) => any
  tap?: (info: any) => void
  effect?: (this: Filed, info: any) => void
  operator?: "toggle" | "onlyone" | "any" | 'single'
  decision?: Decision
  single?: string
  do?: Step[]
  value?: any
}

export function run(this: Filed, flow: Step[], source: any, bools: BoolValues, context: any) {
  return rx(flow).pipe(reduce((acc, step) => {
    let data = acc
    if (step.map) {
      data = step?.map?.(acc)
    }

    if (step.tap) {
      step.tap(data)
    }

    if (step.effect) {
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
