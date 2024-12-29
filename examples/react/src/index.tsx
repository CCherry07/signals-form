import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Signal } from "@preact/signals-core"
import {
  Validator,
  Events,
  D, Field, Component,
  Props,
  normalizeSignal,
  Actions
} from "@rxform/core"
import Form from "./components/Form"
import Input from "./components/Input"
import InputType from "./components/InputType"
import Checkbox from "./components/Checkbox"
import InputNumber from "./components/InputNumber"
import Cascader from './components/Cascader';
import Select from './components/Select';
import { Card as CardComponent } from './components/Card';
import { createGroupForm } from "@rxform/react"
import { App } from "./App"
import { z } from 'zod';
import { zodResolver } from "@rxform/resolvers"

type Model = Signal<{
  userinfo: Signal<{
    email: Signal<string>,
    password: Signal<number>,
    nickname: Signal<string>,
    residence: Signal<string[]>
    phone: Signal<number>,
    donation: Signal<number>,
  }>
}>
const bools = {
  isNickname: (model: Model) => normalizeSignal('userinfo.nickname', model).value === "cherry"
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
  hidden: D.use('isNickname'),
  recoverValueOnShown: true,
})
@Props({
  title: "E-mail"
})
@Validator({
  initiative: {
    all: [
      {
        schema: z.string().email({ message: "E-mail is not a valid email address" }),
      }
    ]
  },
})
@Events({
  onChange(data) {
    this.value.value = data
  }
})
@Actions({
  setDefaultValue() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("chen@163.com")
      }, 500)
    })
  },
  onSubmitValue(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(data + "@163.com")
      }, 500)
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
  disabled: D.use('isNickname'),
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
  props: {
    title: "Nickname"
  }
})
class Nickname extends Field {
  constructor() {
    super()
  }
}

@Component({
  id: "residence",
  component: "cascader",
  props: {
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
  constructor() {
    super()
  }
}

@Component({
  id: "donation",
  component: "inputNumber",
  props: {
    title: "Donation"
  }
})
@Actions({
  onSubmitValue(model: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(model / 2)
      }, 500)
    })
  }
})
class Donation extends Field {
  constructor() {
    super()
  }
}

@Component({
  id: "intro",
  component: "inputType",
  props: {
    title: "Intro",
    type: "TextArea"
  }
})
class Intro extends Field {
  constructor() {
    super()
  }
}
@Component({
  id: "gender",
  component: "select",
  props: {
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
  constructor() {
    super()
  }
}
@Component({
  id: "captcha",
  component: "input",
  props: {
    title: "Captcha",
  }
})
class Captcha extends Field {
  constructor() {
    super()
  }
}
@Component({
  id: "agreement",
  component: "checkbox",
  props: {
    title: "Captcha",
  }
})
class Agreement extends Field {
  constructor() {
    super()
  }
}

@Component({
  id: 'userinfo',
  component: 'form',
  properties: [
    Email,
    Password,
    Nickname,
    Residence,
    Phone,
    Donation,
    Intro,
    Gender,
    Captcha,
    Agreement
  ],
  props: {
    style: {
      width: "400px"
    }
  }
})
@Actions({
  setDefaultValue() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          password: 123456,
          phone: 12345678901,
          donation: 100,
          intro: "I am a good man",
        })
      })
    })
  }
})
class UserInfo extends Field {
  constructor(id?: string) {
    super()
    id && (this.id = id)
  }
}
const graph = [
  UserInfo
]

const formGroup = createGroupForm()
const form1 = formGroup.add({
  validatorEngine: "zod",
  defaultValidatorEngine: "zod",
  boolsConfig: bools,
  graph,
  id: 'form1',
  resolvers:{
    validator: {
      zod: zodResolver
    }
  },
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
const form2 = formGroup.add({
  validatorEngine: "zod",
  defaultValidatorEngine: "zod",
  boolsConfig: bools,
  graph,
  id: 'form2',
  resolvers:{
    validator: {
      zod: zodResolver
    }
  },
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
root.render(<App apps={[
  form1.app,
  form2.app
]} forms={[
  form1.form,
  form2.form
]} />);
