import React from "react";
import { ReactNode } from "react";
import { createForm } from "@formula/react"
import { defineField } from "@formula/core";
import { z } from "zod";
import { zodResolver } from "@formula/resolvers";

import Form from "../../components/Form";
import Input from "../../components/Input";
import { App } from "./app"

interface Props {
  label: string
  type?: "Group" | "Search" | "TextArea" | "Password" | "OTP";
  prefix?: ReactNode
  required?: boolean
}

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
  .validator(z.string({ message: "用户名为必填项" }).min(2, "用户名长度必须在2-10").max(10, "用户名长度必须在2-10").regex(/^[a-zA-Z]+$/, { message: "用户名必须是英文" }))


const password = defineField<string, Props>()
  .component({
    id: "password",
    component: Input,
  })
  .props({ label: "密码", type: "Password", prefix: "🔒", required: true })
  .validator(z.string({ message: "密码必须包含大小写字母、数字和特殊字符" })
    .min(6, "密码长度必须在6-16").max(16, "密码长度必须在6-16")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{6,16}$/, { message: "密码必须包含大小写字母、数字和特殊字符" }))


const useraccount = defineField<{ username: string, password: string }, any>()
  .component({
    id: "account",
    component: Form,
  })
  .properties([
    username,
    password
  ])
  .props({
    style: {
      width: "400px"
    }
  })


const { app, form } = createForm({
  id: "login",
  defaultValidatorEngine: "zod",
  graph: [
    useraccount
  ],
  resolvers: {
    validator: {
      zod: zodResolver
    }
  }
})

export default function () {
  return <App app={app} form={form} />
}
