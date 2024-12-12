import React from 'react';
import { createRoot } from 'react-dom/client';
import { Signal, signal } from "@preact/signals-core"
import {
  Validator,
  Events,
  Signal as FiledSignal,
  D, createTemplateLiterals, Filed, Component, ModelPipe,
  Props
} from "@rxform/core"
import InputComponent from "./components/Input"
import { createForm } from "@rxform/react"
import { App } from "./App"
import { map, tap } from 'rxjs';
import { z } from 'zod';

interface Context {
  name: Signal<string>,
  age: Signal<number>
}
const context: Context = {
  name: signal('a'),
  age: signal(0)
};

const bools = {
  isCherry: (context: Signal<Context>) => context.value.name.value === 'cherry',
  is100: (context: Signal<Context>) => context.value.age.value === 100,
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
        schema: z.string({ message: "name is not string" }),
      }
    ]
  },
  signal: {
    all: [
      // {
      //   fact: {
      //     a: "$state",
      //     c: js`$state.value * 100`,
      //   },
      //   schema: z.object({})
      // }
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
          decision: D.use('is100'),
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
          decision: D.not('is100'),
          do: [
            {
              effect(info) {
                console.log('not 100', info);
                this.value.value = info
              },
            }
          ]
        }
      ]
    },
  ]
})
@Props({
  type: "text",
  title: "name"
})
class Name extends Filed {
  constructor() {
    super()
  }
}


@Component({
  id: "age",
  component: InputComponent,
})
@Props({
  type: "number",
  title: "age"
})
@Validator({
  initiative: {
    all: [
      {
        schema: z.number({ message: "a is not number" }),
      }
    ]
  },
})
class Age extends Filed {
  constructor() {
    super()
  }
}

const graph = {
  name: new Name(),
  age: new Age()
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
