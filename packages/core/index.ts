import { filter, fromEvent, map, reduce, rx } from "rxjs"
import { D as _D, type Decision, registerCustomOperator, setup } from "./boolless"
import createTemplateLiterals from "@rxform/shared/createTemplateLiterals"
import { effect, Signal, signal } from "@preact/signals-core"
import { z } from "zod"
import { createRXForm } from "./model/form"
import { ValidateItem } from "./validate"

registerCustomOperator(
  "n_and",
  {
    operator(...bools: boolean[]) {
      return !bools.every(Boolean)
    },
  }
)

registerCustomOperator(
  "n_or",
  {
    operator(...bools: boolean[]) {
      return !bools.some(Boolean)
    },
  }
)

const effects = new Map<string, Function>()

let T = _D as typeof _D & {
  n_and: (...nodes: (string | Node)[]) => Decision
  n_or: (...nodes: (string | Node)[]) => Decision
}

interface Context {
  a: Signal<string>,
  b: Signal<string>,
  c: Signal<string>,
  d: Signal<string>,
  userInfo: Signal<{ name: Signal<string>, age: Signal<number> }>
}

const context: Context = {
  a: signal('a'),
  b: signal('bb'),
  c: signal('c'),
  d: signal('dd'),
  userInfo: signal({ name: signal('Tom'), age: signal(18) })
};

const bools = {
  isA: (context: Context) => context.a.value === 'a',
  isB: (context: Context) => context.b.value === 'b',
  isC: (context: Context) => context.c.value === 'c',
  isD: (context: Context) => context.d.value === 'd',
  isTom: (context: Context) => context.userInfo.value.name.value === 'Tom',
}
const js = createTemplateLiterals({}, context)
const valuesSignals = setup(bools, context);

interface Step {
  map?: (value: any) => any
  tap?: (info: any) => void
  effectTarget?: string
  effectProp?: string
  operator?: "toggle" | "onlyone" | "any" | 'single'
  condition?: Decision
  single?: string
  do?: Step[]
}

export const signalFlow = (flow: Step[], deps: Signal[]) => {
  effect(() => {
    run(deps, flow).subscribe()
  })
}

setTimeout(() => {
  context.a.value = 'xxx'
}, 3000);

const budget = {
  componentConfig: {
    id: 'budget',
    component: "input",
    display: T.and('isA', 'isC'),
    validate: {
      initiative: { // 事件驱动
        all: [
          {
            engine: "zod",
            schema: z.number({ message: "出价是必填的" }).min(1),
            on: "change"
          } as ValidateItem
        ],
      },
      signal: { // 信号驱动
        all: [
          {
            engine: "qc",
            fact: {
              a: "$.a",
              roi: js`$state.value * 100`,
            },
            schema: "RoiValidate"
          }
        ]
      }
    },
  },
  signal: { // 信号驱动
    "$.a": {
      condition: T.and('isA', "isC", 'isTom'),
      do: [
        {
          effectTarget: "budget",
          effectProp: "disabled",
          value: true
        }
      ]
    },
  },
  events: {
    change: [
      {
        map: (info: string) => {
          context.userInfo.value.name.value = info
          return info
        }
      },
      {
        operator: "onlyone",
        do: [
          {
            condition: T.and('isA', 'isB').or('isC', 'isD'),
            do: [
              {
                effectTarget: "button",
                effectProp: "innerText",
                map: (info: string) => {
                  return info + " isA and isC"
                },
                tap: (info: string) => {
                  console.log("info", info);
                }
              }
            ]
          },
          {
            condition: T.and('isA', 'isC').or('isB'),
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
    ]
  },
} as const

const graph = {
  budget,
}
const from = createRXForm({
  validatorEngine: "zod",
  defaultValidatorEngine: "zod",
  boolsConfig: bools,
  graph
})

console.log(from);



// const input = document.querySelector("#input")!

// fromEvent<InputEvent>(input, "input").subscribe({
//   next(value) {
//     run((value.target as HTMLInputElement).value, flow).subscribe()
//   },
// })
