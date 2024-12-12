import React from 'react';
import { createRoot } from 'react-dom/client';
import { Signal, signal } from "@preact/signals-core"
import {
  Validator,
  Events,
  Signal as FiledSignal,
  D, createTemplateLiterals, Filed, Component, ModelPipe
} from "@rxform/core"
import BudgetComponent from "./components/Budget"
import { createForm } from "@rxform/react"
import { Main } from "./App"
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

@Component({
  id: "budget",
  component: BudgetComponent,
  disabled: D.or('isA', 'isC'),
  display: D.and('isA', 'isC'),
})
@ModelPipe({
  data2model() {
    return "data2model value"
  }
})
@FiledSignal({
  "$.a": {
    decision: D.and('isA', "isC", 'isTom'),
    do: [
      {
        value: true
      }
    ]
  },
})
@Validator({
  signal: {
    all: [
      {
        engine: "custom",
        fact: {
          a: "$.a",
          c: js`$state.value * 100`,
        },
        schema: "CustomValidate"
      }
    ]
  }
})
@Events({
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
          decision: D.and('isA', 'isB').or('isC', 'isD'),
          do: [
            {
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
          decision: D.and('isA', 'isC').or('isB'),
          do: [
            {
              map: (info: string) => {
                return info + " is not A and C"
              }
            }
          ]
        }
      ]
    },
  ]
})
class Budget extends Filed {
  value: Signal<string> = signal("default value")
  constructor() {
    super()
  }
  onChange(e: any): void {
    this.value.value = e.target.value
  }
  onInit(): void {
    console.log("onInit");
  }
  onDestroy(): void {
    console.log("onDestroy");
  }
  onDisabled(): void {
    console.log("onDisabled");
  }
  onBlur(): void {
    console.log("onBlur");
  }
  onBeforeInit(): void {
    console.log("onBeforeInit");
  }
  onDisplay(): void {
    console.log("onDisplay");
  }
  onFocus(): void {
    console.log("onFocus");
  }
  onValidate(): void {
    console.log("onValidate");
  }
  onValueChange(): void {
    console.log("onValueChange");
  }
}
const graph = {
  budget: new Budget(),
}
export const {
  from,
  app
} = createForm({
  validatorEngine: "zod",
  defaultValidatorEngine: "zod",
  boolsConfig: bools,
  graph,
  components: {
    budget: BudgetComponent
  }
})

const root = createRoot(document.getElementById('root')!);
root.render(<Main app={app} from={from} />);
