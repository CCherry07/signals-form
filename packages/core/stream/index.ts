import { rx, reduce, filter, map } from "rxjs"
import { Decision } from "../boolless"

export interface Step {
  map?: (value: any) => any
  tap?: (info: any) => void
  effectTarget?: string
  effectProp?: string
  operator?: "toggle" | "onlyone" | "any" |'single'
  condition?: Decision
  single?: string
  do?: Step[]
}

export const run = (source: any, flow: Step[]) => {
  return rx(flow).pipe(reduce((acc, step) => {
    let data = acc

    if (step.map) {
      data = step?.map?.(acc)
    }

    if (step.tap) {
      step.tap(data)
    }

    if (step.effectTarget && step.effectProp) {
      const dom = document.querySelector(`#${step.effectTarget}`)!
      if (dom) {
        // @ts-ignore
        dom[step.effectProp] = data
      }
    }

    if (step.operator === "onlyone") {
      const res = step.do!.find((step) => step.condition?.evaluate({}))
      if (res) {
        run(data, res.do!).subscribe()
      }
    }

    if (step.operator === "any") {
      rx(step.do!).pipe(
        filter((step) => !!step.condition?.evaluate({})),
        map((step) => step.do)
      ).subscribe(
        {
          next: (v) => {
            run(data, v!).subscribe()
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
