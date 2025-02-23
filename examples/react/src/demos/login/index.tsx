import { createForm } from "@signals-form/react"
import { defineField, defineRelation } from "@signals-form/core";
import Input from "../../components/Input";
import { promise, z } from "zod";
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
  .events({
    onChange(value) {
      this.setValue(() => {
        const num = Math.floor(Math.random() * 100)
        const state = value + String(num)
        this.setProp('label', state)
        return state
      })

      this.setValue(() => {
        const num = Math.floor(Math.random() * 100)
        const state = value + String(num)
        this.setProp('label', state)
        return state
      })
    }
  })


const password = defineField<string, Props>()
  .component({
    id: "password",
    component: Input,
  })
  .props({ label: "密码", type: "Password", prefix: "🔒", required: true })
  .relation(defineRelation([
    [
      "account.username",
      () => {
        console.log('username');
      }
    ]
  ]))

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
