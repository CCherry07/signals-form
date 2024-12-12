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
import { map, tap } from 'rxjs';
import { z } from 'zod';

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
  initiative: {
    all: [
      {
        schema: z.number({ message: "a is not number" }),
      }
    ]
  },
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
      pipe: [
        map((x) => x)
      ]
    },
    {
      operator: "onlyone",
      do: [
        {
          decision: D.use('isCherry'),
          do: [
            {
              pipe: [
                tap((info) => {
                  console.log("info", info);
                }),
                map((info: string) => {
                  return info + " isA and isC"
                })
              ],
              effect(info) {
                this.value.value = info
              },
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
  onChange(e: any) {
    return e.target.value
  }
  onBeforeInit(): void {
    console.log("onBeforeInit");
  }
  onInit(): void {
    console.log("onInit");
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
