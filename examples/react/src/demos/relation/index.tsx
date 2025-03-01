import React from "react";
import { ReactNode } from "react";
import { createForm } from "@signals-form/react"
import { createDecision, defineField, setupRelation } from "@signals-form/core";
import { z } from "zod";
import { zodResolver } from "@signals-form/resolvers";
import Form from "../../components/Form";
import Input from "../../components/Input";
import { App } from "./app"
import InputNumber from "../../components/InputNumber";
import { Info } from "./info"
interface Props {
  label: string
  type?: "Group" | "Search" | "TextArea" | "Password" | "OTP";
  prefix?: ReactNode
  required?: boolean
}
interface Model {
  account: {
    username: string
    password: string
    age: number,
    address: string
  }
}

const boolsConfig = {
  isTom: (model: Model) => model.account.username === "tom",
  isJerry: (model: Model) => model.account.username === "jerry",
  is18: (model: Model) => model.account.age >= 18,
  isChongqing: (model: Model) => model.account.address === "重庆"
}

const D = createDecision(boolsConfig)


const username = defineField<string, Props>()
  .component({
    id: "username",
    component: Input
  })
  .props({
    label: "用户名",
    prefix: "👤",
    required: true
  })
  .events({
    onChange: function (value) {
     this.value = value
    },
  })
  .validator(z.string({ message: "用户名为必填项" }).min(2, "用户名长度必须在2-10").max(10, "用户名长度必须在2-10").regex(/^[a-zA-Z]+$/, { message: "用户名必须是英文" }))


const password = defineField<string, Props>()
  .component({
    id: "password",
    component: Input,
  })
  .props({ label: "密码", type: "Password", prefix: "🔒", required: true })
  .validator(
    {
      initiative: {
        schema: z.string({ message: "密码必须包含大小写字母、数字和特殊字符" })
          .min(6, "密码长度必须在6-16").max(16, "密码长度必须在6-16")
          .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{6,16}$/, { message: "密码必须包含大小写字母、数字和特殊字符" }),
      }
    }
  )
const age = defineField<number, Props>()
  .component({
    id: "age",
    component: InputNumber,
    hidden: D.use('isJerry'),
  })
  .props({
    label: "年龄",
    prefix: "🎂",
    required: true
  })
  .actions({
    onSubmitValue(model) {
      const username = this.getAbstractModel().getFieldsValue("account.username")
      console.log(password.value);
      if (username === "tom") {
        return model
      }
      return 18
    },
    setDefaultValue() {
      return 18
    },
  })
  .validator(z.number({ message: "年龄必须是数字" }).min(1, "年龄必须大于0").max(100, "年龄必须小于100"))

const address = defineField<string, Props>()
  .component({
    id: "address",
    component: Input,
  })
  .props({
    label: "地址",
    prefix: "🏠",
    required: true
  })
  .validator(z.string({ message: "地址为必填项" }).min(2, "地址长度必须在2-10").max(10, "地址长度必须在2-10"))


const info = defineField<any, any>()
  .component({
    id: "info",
    component: Info,
  })
  .props({
    label: "信息"
  })
  .actions({
    setDefaultValue() {
      return []
    },
  })



const useraccount = defineField<Model['account'], any>()
  .component({
    id: "account",
    component: Form,
  })
  .properties([
    username,
    password,
    age,
    address,
    info
  ])
  .props({
    style: {
      width: "400px"
    }
  })

const { app, form } = createForm({
  id: "boolless",
  defaultValidatorEngine: "zod",
  graph: [
    useraccount
  ],
  boolsConfig,
  resolvers: {
    validator: {
      zod: zodResolver
    }
  }
})

// 设置关系
setupRelation({
  field: age,
  dependencies: 'account.username',
  update: (field, aValue) => {
    console.log('age', aValue);
    field.value = aValue === "tom" ? 18 : 0;
  }
});

setupRelation({
  field: info,
  dependencies: ['account.username', 'account.age'],
  update: (field, [aValue, bValue]) => {
    console.log('info', aValue, bValue);
    
    field.setValue([`C from A: ${aValue}, B: ${bValue}`]);
  }
});
export default function () {
  return <App app={app} form={form} />
}
