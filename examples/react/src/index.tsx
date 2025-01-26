import React from 'react';
import { createRoot } from 'react-dom/client';
import Form from "./components/Form"
import Input from "./components/Input"
import InputType from "./components/InputType"
import InputNumber from "./components/InputNumber"
import Cascader from './components/Cascader';
import Select from './components/Select';
import { createForm } from "@rxform/react"
import { App } from "./App"
import { zodResolver } from "@rxform/resolvers"
import { DeepSignal } from 'alien-deepsignals';
import { D, defineField } from "@rxform/core"

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
  isNickname: (model: Model) => {
    console.log(model.userinfo.nickname);
    return model.userinfo.nickname === "cherry"
  }
}

const email = defineField()
  .component({
    component: Input,
    hidden: D.use('isNickname'),
    id: "email",
    props: {
      placeholder: "请输入邮箱",
      label: "邮箱"
    }
  }).build()

const password = defineField()
  .component({
    component: InputType,
    id: "password",
    props: {
      type: "password",
      placeholder: "请输入密码",
      label: "密码"
    }
  }).build()

const phone = defineField()
  .component({
    component: InputNumber,
    id: "phone",
    props: {
      placeholder: "请输入手机号",
      label: "手机号"
    }
  }).build()

const donation = defineField().component({
  component: InputNumber,
  id: "donation",
  props: {
    placeholder: "请输入捐款金额",
    label: "捐款金额"
  }
}).build()

const residence = defineField().component({
  component: Cascader,
  id: "residence",
  props: {
    placeholder: "请选择地区",
    label: "地区"
  }
}).build()

const nickname = defineField().component({
  component: Input,
  id: "nickname",
  props: {
    label: "昵称",
  }
}).build()

const select = defineField().component({
  component: Select,
  id: "select",
  props: {
    placeholder: "请选择",
    label: "选择",
    options: []
  }
}).build()

const userinfo = defineField().component({
  component: Form,
  id: "userinfo",
  props: {
    label: "用户信息",
    style: {
      width: "400px"
    }
  },
  properties: [
    email,
    nickname,
    password,
    phone,
    donation,
    residence,
    select
  ]
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

