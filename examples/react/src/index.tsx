import React from 'react';
import {createRoot} from 'react-dom/client';
import {
  Actions,
  Component,
  Condition,
  D,
  DispatchData,
  Field,
  Fields,
  Inject,
  InjectFields,
  match,
  Provide,
  SubscribeData,
  Validator
} from "@rxform/core"
import Form from "./components/Form"
import Input from "./components/Input"
import InputType from "./components/InputType"
import Checkbox from "./components/Checkbox"
import InputNumber from "./components/InputNumber"
import Cascader from './components/Cascader';
import Select from './components/Select';
import {Card as CardComponent} from './components/Card';
import {createGroupForm} from "@rxform/react"
import {App} from "./App"
import {z} from 'zod';
import {zodResolver} from "@rxform/resolvers"
import {DeepSignal} from 'alien-deepsignals';
import {signal} from 'alien-signals';

type Model = DeepSignal<{
  userinfo: {
    email: string,
    password: number,
    nickname: string,
    residence: string[]
    phone: number,
    donation: number,
  }
}>
const bools = {
  isNickname: (model: Model) => model.userinfo.nickname === "cherry"
}
@Component({
  id: 'phone',
  component: 'inputNumber',
})
class Phone extends Field {
  title = "Phone Number"
}

@Component({
  id: 'email',
  component: 'input',
  hidden: D.use('isNickname'),
  recoverValueOnShown: true,
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
  title = "email"
  onInit(): void {
  }
  onDestroy(): void {
  }
  onChange(data: any) {
    this.value = data
  }
}
@Component({
  id: 'password',
  component: "inputType",
  disabled: D.use('isNickname'),
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
  type = "Password"
  title = "password"

  @Inject({
    provideValues: "provideValues",
    app: "appContextProvides"
  })
  provideValue = {
    default: "123456"
  }
}

@Component({
  id: "nickname",
  component: "input",
})
class Nickname extends Field {
  title = "Nickname"
  @SubscribeData('userinfo')
  onUserInfo(data: any) {
    console.log("onUserInfo", data);
  }
}

@Component({
  id: "residence",
  component: "cascader",
})
class Residence extends Field {
  title = "Habitual Residence"
  options = [
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

@Component({
  id: "intro",
  component: "inputType",
})
class Intro extends Field {
  title = "Intro"
  type = "TextArea"
}


@Component({
  id: "donation",
  component: "inputNumber",
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
  title = "Donation"
}

@Component({
  id: "gender",
  component: "select",
})
@InjectFields({
  donation: "userinfo.donation"
})
class Gender extends Field {
  title = "Gender"
  options = [
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

  onChange(data: any) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(data)
        this.value = data
      }, 500)
    })
  }

  @Fields({
    donation: "donation"
  })
  onDonationValue(fields: Record<string, any>) {
    console.log("onDonationValue", fields);
    this.value = "handle change"
  }
}


@Component({
  id: "captcha",
  component: "input",
})
@InjectFields({
  gender: "userinfo.gender",
})
class Captcha extends Field {
  title = "Captcha"

  @Fields({
    gender: "gender",
  })
  onGenderValue(fields: Record<string, any>) {
    console.log("onGenderValue", fields);
    this.isUpdating = false
  }
}
@Component({
  id: "agreement",
  component: "checkbox",
})
class Agreement extends Field {
  title = "agreement"
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
})
@Actions({
  setDefaultValue() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          phone: 12345678901,
          donation: 100,
          intro: "I am a good man",
        })
      })
    })
  }
})
class UserInfo extends Field {
  @DispatchData("userinfo", false)
  userinfo = {}

  @Provide('provideValues')
  provideValues = signal({})

  style = {
    width: "400px"
  }

  px = match(this.style, [
    [{ width: "400px" }, () => {
      return {
        width: "400px"
      }
    }],
    [{ width: "500px" }, () => {
      return {
        width: "500px"
      }
    }],
  ])

  @Condition(D.use('isNickname'))
  setOptions() {
    console.log("setOptions 执行了");
    this.userinfo = Math.floor(Math.random() * 100)
    this.provideValues.set({
      "test": "test"
    })
  }
}
const graph = [
  UserInfo
]

const formGroup = createGroupForm({
  provides: {
    appContextProvides: {
      data: "data"
    }
  }
})
const form1 = formGroup.add({
  defaultValidatorEngine: "zod",
  boolsConfig: bools,
  graph,
  id: 'form1',
  resolvers: {
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
// const form2 = formGroup.add({
//   defaultValidatorEngine: "zod",
//   boolsConfig: bools,
//   graph,
//   id: 'form2',
//   resolvers: {
//     validator: {
//       zod: zodResolver
//     }
//   },
//   components: {
//     form: Form,
//     input: Input,
//     checkbox: Checkbox,
//     card: CardComponent,
//     inputType: InputType,
//     inputNumber: InputNumber,
//     cascader: Cascader,
//     select: Select
//   }
// })

const root = createRoot(document.getElementById('root')!);
root.render(<App apps={[
  form1.app,
]} forms={[
  form1.form,
]} />);
