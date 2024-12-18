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
  normalizeSignal,
  ModelPipe
} from "@rxform/core"
import Form from "./components/Form"
import Input from "./components/Input"
import InputType from "./components/InputType"
import Checkbox from "./components/Checkbox"
import InputNumber from "./components/InputNumber"
import Cascader from './components/Cascader';
import Select from './components/Select';
import { Card as CardComponent } from './components/Card';
import { createForm } from "@rxform/react"
import { App } from "./App"
import { z } from 'zod';
import { map, tap } from 'rxjs';

const bools = {

}
@Component({
  id: 'phone',
  component: 'inputNumber',
  props: {
    title: "Phone Number"
  }
})
class Phone extends Field {
  constructor() {
    super()
  }
}

@Component({
  id: 'email',
  component: 'input',
})
@Props({
  title: "E-mail"
})
@Validator({
  initiative: {
    all: [
      {
        schema: z.string().email({ message: "a is not email" }),
      }
    ]
  },
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
              this.value.value = info
            },
          }
        ]
      ],
    },
  ]
})
@ModelPipe({
  data2model(){
    return new Promise((resolve)=>{
      setTimeout(()=>{
        resolve("chen@163.com")
      }, 5000)
    })
  }
})
class Email extends Field {
  constructor() {
    super()
  }
  onInit(): void {
  }
  onDestroy(): void {
  }
}
@Component({
  id: 'password',
  component: "inputType",
  disabled: D.use('isCherry'),
  props: {
    type: "Password",
    title: "password"
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
class Password extends Field {
  constructor() {
    super()
  }
}

@Component({
  id: "nickname",
  component: "input",
  props:{
    title: "Nickname"
  }
})
class Nickname extends Field {
  constructor(){
    super()
  }
}

@Component({
  id: "residence",
  component: "cascader",
  props:{
    title: "Habitual Residence",
    options: [
      {
        value: 'zhejiang',
        label: 'Zhejiang',
        children: [
          {
            value: 'hangzhou',
            label: 'Hangzhou',
            children: [
              {
                value: 'xihu',
                label: 'West Lake',
              },
            ],
          },
        ],
      },
    ]
  }
})
class Residence extends Field {
  constructor(){
    super()
  }
}

@Component({
  id: "donation",
  component: "inputNumber",
  props:{
    title: "Donation"
  }
})
class Donation extends Field {
  constructor(){
    super()
  }
}

@Component({
  id: "intro",
  component: "inputType",
  props:{
    title: "Intro",
    type: "TextArea"
  }
})
class Intro extends Field {
  constructor(){
    super()
  }
}
@Component({
  id: "gender",
  component: "select",
  props:{
    title: "Gender",
    options: [
      {
        value: "male",
        label: "Male"
      },
      {
        value: "female",
        label: "Female"
      },
      {
        value: "other",
        label: "Other"
      }
    ]
  }
})
class Gender extends Field {
  constructor(){
    super()
  }
}
@Component({
  id: "captcha",
  component: "input",
  props:{
    title: "Captcha",
  }
})
class Captcha extends Field {
  constructor(){
    super()
  }
}
@Component({
  id: "agreement",
  component: "checkbox",
  props:{
    title: "Captcha",
  }
})
class Agreement extends Field {
  constructor(){
    super()
  }
}

@Component({
  id: 'userinfo',
  component: 'form',
  properties: {
    email: new Email(),
    password: new Password(),
    nickname: new Nickname(),
    residence: new Residence(),
    phone: new Phone(),
    donation: new Donation(),
    intro: new Intro(),
    gender: new Gender(),
    captcha: new Captcha(),
    agreement: new Agreement()
  },
  props: {
    style:{
      width: "400px"
    }
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
} = await createForm({
  validatorEngine: "zod",
  defaultValidatorEngine: "zod",
  boolsConfig: bools,
  graph,
  initMode: "async",
  components: {
    form: Form,
    input: Input,
    checkbox: Checkbox,
    card: CardComponent,
    inputType: InputType,
    inputNumber: InputNumber,
    cascader: Cascader,
    select: Select
  }
})
const root = createRoot(document.getElementById('root')!);
root.render(<App app={app} from={from} />);
