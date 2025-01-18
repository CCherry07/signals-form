import React from 'react';
import { createRoot } from 'react-dom/client';
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
import { zodResolver } from "@rxform/resolvers"
import { DeepSignal, signal } from 'alien-deepsignals';
import { defineField } from "@rxform/core"

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

const email = defineField().component({
  component: Input,
  id: "email",
  props:{
    placeholder: "请输入邮箱",
    label: "邮箱"
  }
})

const password = defineField().component({
  component: InputType,
  id: "password",
  props:{
    type: "password",
    placeholder: "请输入密码",
    label: "密码"
  }
})

const phone = defineField().component({
  component: InputNumber,
  id: "phone",
  props:{
    placeholder: "请输入手机号",
    label: "手机号"
  }
})

const donation = defineField().component({
  component: InputNumber,
  id: "donation",
  props:{
    placeholder: "请输入捐款金额",
    label: "捐款金额"
  }
})

const residence = defineField().component({
  component: Cascader,
  id: "residence",
  props:{
    placeholder: "请选择地区",
    label: "地区"
  }
})

const isNickname = defineField().component({
  component: Checkbox,
  id: "isNickname",
  props:{
    label: "是否为昵称",
  }
})

const card = defineField().component({
  component: CardComponent,
  id: "card",
  props:{
    label: "个人信息"
  }
})

const select = defineField().component({
  component: Select,
  id: "select",
  props:{
    placeholder: "请选择",
    label: "选择",
    options: []
  }
})

const userinfo = defineField().component({
  component: Form,
  id: "userinfo",
  props:{
    label: "用户信息"
  },
  properties: [
    email,
    password,
    phone,
    donation,
    residence,
    isNickname,
    select
  ]
})

const { app, form } = createForm({
  graph: [
    userinfo
  ],
  boolsConfig: bools,
})


const root = createRoot(document.getElementById('root'));

root.render(<App app={app} form={form} />);

