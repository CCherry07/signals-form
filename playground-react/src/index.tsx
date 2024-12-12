import React from 'react';
import { createRoot } from 'react-dom/client';
import { Signal, signal } from "@preact/signals-core"
import {
  Validator,
  Events,
  Signal as FiledSignal,
  D, createTemplateLiterals, Filed, Component, ModelPipe
} from "@rxform/core"
import InputComponent from "./components/Input"
import { createForm } from "@rxform/react"
import { App } from "./App"

interface Context {
  name: Signal<string>,
}
const context: Context = {
  name: signal('a'),
};

const bools = {
  isCherry: (context: Signal<Context>) => context.value.name.value === 'cherry',
}
const js = createTemplateLiterals({}, context)

@Component({
  id: "name",
  component: InputComponent,
  disabled: D.or('isA', 'isC'),
  display: D.and('isA', 'isC'),
})
@ModelPipe({
  data2model() {
    return ""
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
  onChange: [
    {
      map: (info: string) => {
        return info
      }
    },
    {
      operator: "onlyone",
      do: [
        {
          decision: D.use('isCherry'),
          do: [
            {
              map: (info: string) => {
                return info + " isA and isC"
              },
              effect(info) {
                this.value.value = info
              },
              tap: (info: string) => {
                console.log("info", info);
              }
            }
          ]
        },
        {
          decision: D.not('isCherry'),
          do: [
            {
              effect(info) {
                this.value.value = info
              },
            }
          ]
        }
      ]
    },
  ]
})
class Name extends Filed {
  constructor() {
    super()
  }
  onChange(e: any): void {
    return e.target.value
  }
}
const graph = {
  budget: new Name(),
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
    input: InputComponent
  }
})

const root = createRoot(document.getElementById('root')!);
root.render(<App app={app} from={from} />);
