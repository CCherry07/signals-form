import React from 'react';
import { createRoot } from 'react-dom/client';
import { batch, Signal } from "@preact/signals-core"
import {
  Validator,
  Events,
  Signal as FiledSignal,
  D, Filed, Component, ModelPipe,
  js,
  Props
} from "@rxform/core"
import InputComponent from "./components/Input"
import CheckboxComponent from "./components/Checkbox"
import { Card as CardComponent } from './components/Card';
import { createForm } from "@rxform/react"
import { App } from "./App"
import { map, tap } from 'rxjs';
import { z } from 'zod';

interface Context {
  userInfo: Signal<{
    name: Signal<string>,
    age: Signal<number>
  }>
  a: Signal<boolean>
}

const bools = {
  isCherry: (context: Signal<Context>) => context.value.userInfo.value.name.value === 'cherry',
  isTom: (context: Signal<Context>) => context.value.userInfo.value.name.value === 'tom',
  isA: (context: Signal<Context>) => context.value.userInfo.value.name.value === 'A',
  is100: (context: Signal<Context>) => context.value.userInfo.value.age.value === 100,
  isDisabled: (context: Signal<Context>) => context.value.a.value === true,
}
@Component({
  id: "a",
  component: CheckboxComponent,
  props: {
    type: "checkbox",
    title: "A"
  }
})
class A extends Filed {
  constructor() {
    super()
  }
}

@Component({
  id: "name",
  component: InputComponent,
  disabled: D.or('isA', 'isC'),
  display: D.and('isDisabled', 'is100').not(),
})
@Props({
  type: "text",
  title: "name"
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
      {
        fact: {
          name: "$state.value",
          age: js`$.value.userInfo.value?.age?.value * 100`,
        },
        schema: z.object({
          name: z.string(),
          age: z.number()
        })
      }
    ]
  }
})
@Events({
  onChange: [
    {
      // operator: 'switch',
      // do: [
      //   {
      //     decision: D.use('is100'),
      //     do: [
      //       {
      //         pipe: [
      //           tap((info) => {
      //             console.log("info", info);
      //           }),
      //         ],
      //         effect(info) {
      //           this.value.value = info
      //         },
      //       }
      //     ]
      //   },
      //   {
      //     decision: D.not('is100'),
      //     do: [
      //       {
      //         effect(info) {
      //           this.props!.title = Math.round(Math.random() * 100)
      //           this.value.value = info
      //         },
      //       }
      //     ]
      //   }
      // ]
      effect(info) {
        console.log("effect", info);
        this.props!.title = Math.round(Math.random() * 100)
        this.value.value = info
      },
    },
  ]
})
class Name extends Filed {
  constructor() {
    super()
  }
  onInit(): void {
  }
  onDestroy(): void {
  }
}
@Component({
  id: "age",
  component: InputComponent,
  props: {
    type: "number",
    title: "age"
  }
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

@Component({
  id: "userInfo",
  component: CardComponent,
  properties: {
    name: new Name(),
    age: new Age(),
  },
  props: {
    title: "userInfo"
  }
})
class UserInfo extends Filed {
  constructor() {
    super()
  }
}
const graph = {
  UserInfo: new UserInfo(),
  a: new A()
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
