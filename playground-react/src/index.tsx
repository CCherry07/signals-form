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
import InputNumber from "./components/InputNumber"
import { Card as CardComponent } from './components/Card';
import { createForm } from "@rxform/react"
import { App } from "./App"
import { z } from 'zod';

interface Context {
  userInfo: Signal<{
    name: Signal<string>,
    age: Signal<number>
    open: Signal<boolean>
  }>
}
const bools = {
  isCherry: (context: Signal<Context>) => context.value.userInfo.value.name.value === 'cherry',
  isAgeEq100: (context: Signal<Context>) => context.value.userInfo.value.age.value === 100,
  isDisabled: (context: Signal<Context>) => context.value.userInfo.value.open.value === true,
}
@Component({
  id: "open",
  component: CheckboxComponent,
  props: {
    title: "是否开启"
  }
})
class Open extends Filed {
  constructor() {
    super()
  }
}

@Component({
  id: "name",
  component: InputComponent,
  disabled: D.or('isA', 'isC'),
  display: D.and('isDisabled', 'isAgeEq100').not(),
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
          age: js`$.value.userInfo.value.age.value`,
        },
        schema: z.object({
          name: z.string().max(10).min(2),
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
  component: InputNumber,
  disabled: D.use('isCherry'),
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
    open: new Open()
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
