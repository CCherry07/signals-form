import React from 'react';
import { createRoot } from 'react-dom/client';
import { Signal } from "@preact/signals-core"
import {
  Validator,
  Events,
  Signals as FiledSignal,
  D, Field, Component,
  js,
  Props,
  normalizeSignal
} from "@rxform/core"
import InputComponent from "./components/Input"
import CheckboxComponent from "./components/Checkbox"
import InputNumber from "./components/InputNumber"
import AddrComponent from "./components/Addr"
import { Card as CardComponent } from './components/Card';
import { createForm } from "@rxform/react"
import { App } from "./App"
import { z } from 'zod';
import { map, tap } from 'rxjs';

interface Model {
  userinfo: Signal<{
    name: Signal<string>,
    age: Signal<number>
    open: Signal<boolean>
  }>
}
const bools = {
  isCherry: (model: Signal<Model>) => normalizeSignal('userinfo.name', model).value === 'cherry',
  isAgeEq100: (model: Signal<Model>) => normalizeSignal('userinfo.age', model).value === 100,
  isOpenDisabled: (model: Signal<Model>) => normalizeSignal('userinfo.open', model).value === true,
}
@Component({
  id: 'open',
  component: 'checkbox',
  props: {
    title: "是否开启"
  }
})
class Open extends Field {
  constructor() {
    super()
  }
}

@Component({
  id: 'name',
  component: 'input',
  disabled: D.or('isA', 'isC'),
  display: D.and('isOpenDisabled', 'isAgeEq100').not(),
})
@Props({
  title: "姓名"
})
@FiledSignal({
  "$.userinfo.open": [
    {
      operator: 'if',
      decision: D.use('isOpenDisabled'),
      do: [
        {
          pipe: [
            map((info) => info ? "open true" : "open false"),
          ],
          effect(info) {
            console.log("$.userinfo.open", info);
          }
        }
      ]
    }
  ]
})
@Validator({
  initiative: {
    all: [
      {
        on: "onChange", // 主动校验，事件符合 则执行
        schema: z.string({ message: "姓名必须是字符" }),
      }
    ]
  },
  signal: { // 信号驱动,校验，依赖为 fact
    all: [
      {
        fact: {
          name: "$state.value",
          age: js`$.userinfo.age`,
        },
        schema: z.object({
          name: z.string({ message: "姓名必须是字符" }).max(10, "必须在2-10个字符之间").min(2, "必须在2-10个字符之间"),
          age: z.number({ message: "年龄必须是数字" })
        })
      }
    ]
  }
})
@Events({
  onChange: [
    {
      operator: 'ifelse',
      decision: D.use("isAgeEq100"),
      do: [
        [
          {
            pipe: [
              tap((info) => {
                console.log("info", info);
              }),
            ],
            effect(info) {
              this.value!.value = info
            },
          }
        ],
        [
          {
            effect(info) {
              this.abstractModel.setFieldProps("age", { title: "age" + info })
              this.abstractModel.setFieldValue("age", Math.random() * 100)
              this.value.value = info
            },
          }
        ]
      ],
    },
  ]
})
class Name extends Field {
  constructor() {
    super()
  }
  onInit(): void {
  }
  onDestroy(): void {
  }
}
@Component({
  id: 'age',
  component: InputNumber,
  disabled: D.use('isCherry'),
  props: {
    title: "年龄"
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
class Age extends Field {
  constructor() {
    super()
  }
}

@Component({
  id: "city",
  component: "input",
  props:{
    title: "城市"
  }
})
class City extends Field {
  constructor(){
    super()
  }
}

@Component({
  id: "districtAndCounty",
  component: "input",
  props:{
    title: "区县"
  }
})
class Street extends Field {
  constructor(){
    super()
  }
}



@Component({
  id: "addr",
  component: "addr",
  properties:{
    city: new City(),
    districtAndCounty: new Street()
  }
})
class Addr extends Field {
  constructor(){
    super()
  }
}

@Component({
  id: 'userinfo',
  component: 'card',
  properties: {
    name: new Name(),
    age: new Age(),
    open: new Open(),
    addr: new Addr()
  },
  props: {
    title: "用户信息"
  }
})
class UserInfo extends Field {
  constructor(id?: string) {
    super()
    id && (this.id = id)
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
    input: InputComponent,
    checkbox: CheckboxComponent,
    card: CardComponent,
    addr: AddrComponent
  }
})
const root = createRoot(document.getElementById('root')!);
root.render(<App app={app} from={from} />);
