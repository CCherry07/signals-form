import { Signal, signal } from "@preact/signals-core"
import {
  Validator,
  Events,
  Signal as FiledSignal,
  D, createRXForm, createTemplateLiterals, Filed, Component, ModelPipe
} from "@rxform/core"

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
  component: "input",
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
  value: string = "default value"
  constructor() {
    super()
  }
  onChanges(): void {
    console.log("onChanges");
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
const from = createRXForm({
  validatorEngine: "zod",
  defaultValidatorEngine: "zod",
  // @ts-ignore
  boolsConfig: bools,
  graph
})
console.log(from.model.value);
