import { filter, fromEvent, map, reduce, rx } from "rxjs"
import { D as _D, type Decision, registerCustomOperator } from "./boolless"
import { effect, Signal, signal } from "@preact/signals-core"

registerCustomOperator(
  "reverseAnd",
  {
    operator(...bools: boolean[]) {
      return !bools.every(Boolean)
    },
  }
)

const effects = new Map<string, Function>()

let D = _D as typeof _D & {
  reverseAnd: (...nodes: (string | Node)[]) => Decision
}

const values$ = signal(
  {
    isA: signal<boolean>(true),
    isB: signal<boolean>(false),
    isC: signal<boolean>(true),
    isD: signal<boolean>(false),
  }
)

interface Step {
  map?: (info: string) => void
  effectTarget?: string
  effectProp?: string
  operator?: "toggle" | "onlyone" | "any" | 'single'
  condition?: Decision
  single?: string
  do?: Step[]
}

export const signalFlow = (flow: Step[], deps: Signal[]) => {
  // 1. 如果deps中有值发生变化，那么就重新计算flow
  effect(() => {
    run(deps, flow).subscribe()
  })
}

export const flow: Step[] = [
  {
    map: (info: string) => {
      values$.value.isB.value = (info === "cherry")
    }
  },
  {
    single: "single-auto-toggle",
    condition: D.and('isA', "isD"),
    do: [
      {
        effectTarget: "button",
        effectProp: "innerText",
        map: (info: string) => {
          console.log("info", info);
        }
      }
    ]
  },
  {
    operator: "onlyone",
    do: [
      {
        // @ts-ignore
        condition: D.and('isA', 'isB'),
        do: [
          {
            effectTarget: "button",
            effectProp: "innerText",
            map: (info: string) => {
              return info + " isA and isC"
            }
          }
        ]
      },
      {
        condition: D.and('isA', 'isC').or('isB'),
        do: [
          {
            effectTarget: "button",
            effectProp: "innerText",
            map: (info: string) => {
              return info + " is not A and C"
            }
          }
        ]
      }
    ]
  },
  {
    map: (info: string) => {
      values$.value.isD.value = true
    }
  }
]

export const run = (source: any, flow: Step[]) => {
  return rx(flow).pipe(reduce((acc, step) => {
    let data = acc
    if (step.map) {
      data = step?.map?.(acc) ?? data
    }
    if (step.effectTarget && step.effectProp) {
      const dom = document.querySelector(`#${step.effectTarget}`)!
      if (dom) {
        // @ts-ignore
        dom[step.effectProp] = data
      }
    }
    if (step.operator === "onlyone") {
      const res = step.do!.find((step) => step.condition?.evaluate(values$))
      console.log("res", res);

      if (res) {
        run(data, res.do!).subscribe((v) => data = v)
      }
    }
    if (step.operator === "any") {
      rx(step.do!).pipe(
        filter((step) => !!step.condition?.evaluate(values$)),
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

    if (step.single) {
      const singleKey = step.single
      if (!effects.has(singleKey)) {
        const fn = () => {
          if (step.condition?.evaluate(values$)) {
            run(data, step.do!).subscribe({
              complete() {
                console.log("single operator completed")
              },
            })
          }
        }
        effect(fn)
        effects.set(singleKey, fn)
      }
    }
    // if (step.operator === "toggle") {
    //   if (step.condition.evaluate(values)) {
    //     run(data, step.do![0]).subscribe()
    //   } else {
    //     run(data, step.do![1]).subscribe()
    //   }
    // }
    return data
  }, source))
}

const input = document.querySelector("#input")!

fromEvent<InputEvent>(input, "input").subscribe({
  next(value) {
    run((value.target as HTMLInputElement).value, flow).subscribe()
  },
})
