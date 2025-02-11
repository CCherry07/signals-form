import { z } from "zod"
import { createForm } from "@formula/react"
import { App } from "./app"
import { zodResolver } from "@formula/resolvers"
import { defineField } from "@formula/core"
import React from "react";
import InputType from "../../components/InputType";
import Input from "../../components/Input"
import InputNumber from "../../components/InputNumber"
import Cascader from "../../components/Cascader"
import Select from "../../components/Select"
import Form from "../../components/Form"

const email = defineField()
  .component({
    component: Input,
    id: "email",
  })
  .props({
    placeholder: "请输入邮箱",
    label: "邮箱",
    required: true
  })
  .validator(z.string({ message: "必须是一个字符串" }).email({ message: "输入的字符串必须是一个合法的邮箱" }))


const nickname = defineField()
  .component({
    component: Input,
    id: "nickname",
  })
  .props({
    placeholder: "请输入昵称",
    label: "昵称",
    required: true
  })
  .validator(z.string({ message: "必须是一个字符串" }).min(2, { message: "昵称长度必须大于2" }))


const password = defineField()
  .component({
    component: InputType,
    id: "password",
  }).props({
    type: "Password",
    placeholder: "请输入密码",
    label: "密码",
    required: true
  })
  .validator(z.string({ message: "必须是一个字符串" }).min(6, { message: "密码长度必须大于6" }))


const phone = defineField()
  .component({
    component: InputNumber,
    id: "phone",
  })
  .props({
    placeholder: "请输入手机号",
    label: "手机号",
    required: true
  })
  .validator(z.string({ message: "必须是一个字符串" }).min(11, { message: "手机号长度必须大于11" }))


const donation = defineField()
  .component({
    component: InputNumber,
    id: "donation",
  })
  .props({
    placeholder: "请输入捐款金额",
    label: "捐款金额",
    required: true
  })
  .validator(z.number({ message: "必须是一个数字" }).min(1, { message: "捐款金额必须大于1" }))


const residence = defineField()
  .component({
    component: Cascader,
    id: "residence",
  })
  .props({
    placeholder: "请选择地区",
    label: "地区",
    required: true,
    options: [
      {
        value: "zhejiang",
        label: "Zhejiang",
        children: [
          {
            value: "hangzhou",
            label: "Hangzhou",
            children: [
              {
                value: "xihu",
                label: "West Lake",
              },
            ],
          },
        ],
      },
      {
        value: "jiangsu",
        label: "Jiangsu",
        children: [
          {
            value: "nanjing",
            label: "Nanjing",
          }
        ],
      },
    ]
  })
  .validator(z.array(z.string()).min(2, { message: "地区长度必须大于2" }))


const paymentType = defineField()
  .component({
    component: Select,
    id: "paymentType",
  })
  .props({
    placeholder: "请选择支付类型",
    label: "支付类型",
    required: true,
    options: [
      {
        value: "1",
        label: "现金",
      },
      {
        value: "2",
        label: "支票",
      },
      {
        value: "3",
        label: "其他",
      },
    ]
  })
  .validator(z.string().min(1, { message: "支付类型长度必须大于1" }))


const userinfo = defineField()
  .component({
    component: Form,
    id: "userinfo",
  }).properties([
    nickname,
    password,
    email,
    phone,
    residence,
    donation,
    paymentType
  ])
  .props({
    label: "用户信息",
    style: {
      width: "400px"
    }
  })

const { app, form } = createForm({
  graph: [
    userinfo
  ],
  id: "edit",
  defaultValidatorEngine: "zod",
  resolvers: {
    validator: {
      zod: zodResolver
    }
  },
})

form.updateModel({
  userinfo: {
    nickname: "张三",
    password: "123456",
    email: "123@163.com",
    phone: 12345678901,
    donation: 100,
    residence: ["zhejiang", "hangzhou", "xihu"],
    paymentType: "1"
  }
})

export default function EditPage() {
  return <App app={app} form={form} />
}
