import React from 'react';
import { createRoot } from 'react-dom/client';
import { z } from "zod"
import Form from "./components/Form"
import Input from "./components/Input"
import InputType from "./components/InputType"
import InputNumber from "./components/InputNumber"
import Cascader from './components/Cascader';
import Select from './components/Select';
import { createForm } from "@formula/react"
import { App } from "./App"
import { zodResolver } from "@formula/resolvers"
import { deepSignal, DeepSignal, effect } from 'alien-deepsignals';
import { D, defineField, defineRelation, get } from "@formula/core"

const store = deepSignal({
  name: "bar",
  info: {
    age: 12
  }
})

const nicknameRelation1 = defineRelation((field) => {
  if (store.info.age > 18) {
    field.value = 'foo'
  } else {
    // do something
  }
})

const nicknameRelation = defineRelation([
  [
    'userinfo.email',
    function (depValues) {
      this.value = Math.floor(Math.random() * 1000)
    }
  ],
  [
    ['userinfo.email', 'userinfo.phone'],
    function (depValues) {
      console.log(depValues);
    }
  ],
  function (field) {
    const data = store.name
    field.value = data;
  }
])

setTimeout(() => {
  store.name = 'tom'
}, 1000);

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
  isMe: (model: Model) => model.userinfo.nickname === "cherry",
  isTom: (model: Model) => model.userinfo.nickname === "tom",
}

const email = defineField<string, any>()
  .component({
    component: Input,
    hidden: D.use('isMe'),
    id: "email",
    recoverValueOnShown: true
  })
  .props({
    placeholder: "请输入邮箱",
    label: "邮箱"
  })
  .events({
    onChange(value) {
      console.log(value, 'onChange');
      if (this.evaluateDecision(D.use('isMe'))) {
        this.setProp("label", "🍺")
      }
      this.value = value
    }
  })
  .validator({
    initiative: z.string({ message: "必须是一个字符串" }).email({ message: "输入的字符串必须是一个合法的邮箱" }),
  })
  .lifecycle({
    onDisabled(state) {
      console.log(state, 'onDisabled');
    },
    onMounted() {
      this.setProp("label", "📮")
    },
    onDestroy() {
    },
  })
  .build()

const nickname = defineField()
  .component({
    component: Input,
    id: "nickname",
  })
  .props({
    placeholder: "请输入昵称",
    label: "昵称"
  })
  .relation(nicknameRelation)
  .lifecycle({
    // onMounted() {
    //   this.value = "tom"
    // },
  })
  .build()

const password = defineField()
  .component({
    component: InputType,
    id: "password",
  }).props({
    type: "password",
    placeholder: "请输入密码",
    label: "密码"
  })
  .build()

const phone = defineField()
  .component({
    component: InputNumber,
    id: "phone",
  }).props({
    placeholder: "请输入手机号",
    label: "手机号"
  })
  .build()

const donation = defineField().component({
  component: InputNumber,
  id: "donation",
}).props({
  placeholder: "请输入捐款金额",
  label: "捐款金额"
}).build()

const residence = defineField().component({
  component: Cascader,
  id: "residence",
}).props({
  placeholder: "请选择地区",
  label: "地区"
}).build()

const select = defineField()
  .component({
    component: Select,
    id: "select",
  }).props({
    placeholder: "请选择",
    label: "选择",
    options: []
  }).build()

const userinfo = defineField()
  .component({
    component: Form,
    id: "userinfo",
  }).properties([
    email,
    nickname,
    password,
    phone,
    donation,
    residence,
    select
  ])
  .props({
    label: "用户信息",
    style: {
      width: "400px"
    }
  }).build()

const { app, form } = createForm({
  graph: [
    userinfo
  ],
  id: "form",
  defaultValidatorEngine: "zod",
  resolvers: {
    validator: {
      zod: zodResolver
    }
  },
  boolsConfig: bools,
})


const root = createRoot(document.getElementById('root')!);

root.render(<App app={app} form={form} />);
