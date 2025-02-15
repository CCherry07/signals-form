import { createForm } from "@signals-form/react"
import { defineField } from "@signals-form/core";
import Input from "../../components/Input";
import { z } from "zod";
import { ReactNode } from "react";
import { zodResolver } from "@signals-form/resolvers";
import Form from "../../components/Form";
import { App } from "./app"
import React from "react";
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
  .validator(z.string({ message: "该字段为必填项" }))


const password = defineField<string, Props>()
  .component({
    id: "password",
    component: Input,
  })
  .props({ label: "密码", type: "Password", prefix: "🔒", required: true })


const age = defineField({
  component:{
    id: "age",
    component: Input,
  },
  events:{
    onChange: function (value) {
      this.value = value
    }
  }
})


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
