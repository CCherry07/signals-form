import { createForm } from "@formula/react"
import { defineField } from "@formula/core";
import Input from "../../components/Input";
import { z } from "zod";
import { ReactNode } from "react";
import { zodResolver } from "@formula/resolvers";
import Form from "../../components/Form";
import { App } from "./app"
import React from "react";
import { Flex } from "./flex";
import { Divider } from "antd";

interface Props {
  label: string
  type?: "Group" | "Search" | "TextArea" | "Password" | "OTP";
  prefix?: ReactNode
  required?: boolean
}

const firstName = defineField<string, Props>()
  .component({
    id: "firstName",
    component: Input
  })
  .props({
    label: "firstName",
    prefix: "👤",
    required: true
  })
  .validator(z.string({ message: "该字段为必填项" }))
  .build()


const lastName = defineField<string, Props>()
  .component({
    id: "lastName",
    component: Input
  })
  .props({
    label: "lastName",
    prefix: "👤",
    required: true
  })
  .validator(z.string({ message: "该字段为必填项" }))
  .build()

const username = defineField<string, Props>()
  .component({
    id: "usernameLayout",
    type: "Void",
    component: Flex,
  })
  .properties([
    firstName,
    lastName
  ])

const password = defineField<string, Props>()
  .component({
    id: "password",
    component: Input,
  })
  .props({ label: "密码", type: "Password", prefix: "🔒", required: true })
  .validator(
    z.string({ message: "密码必须包含大小写字母、数字和特殊字符" })
      .min(6, "密码长度必须在6-16").max(16, "密码长度必须在6-16")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{6,16}$/, { message: "密码必须包含大小写字母、数字和特殊字符" })
  )
  .build()

const divider = defineField()
  .component({
    id: "divider",
    type: "Void",
    component: Divider
  })

const useraccount = defineField<{ username: string, password: string }, any>()
  .component({
    id: "layout",
    type: "Void",
    component: Form,
  })
  .properties([
    username,
    divider,
    password
  ])
  .props({
    style: {
      width: "400px"
    }
  })
  .build()

const { app, form } = createForm({
  id: "void",
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
