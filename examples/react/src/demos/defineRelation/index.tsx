import React from "react";
import { ReactNode } from "react";
import { createForm } from "@signals-form/react"
import { defineField } from "@signals-form/core";
import { zodResolver } from "@signals-form/resolvers";
import Form from "../../components/Form";
import Input from "../../components/Input";
import { App } from "./app"
import { Info } from "./info"
import { defineRelation } from "@signals-form/core/hooks/defineRelation";
interface Props {
  label: string
  type?: "Group" | "Search" | "TextArea" | "Password" | "OTP";
  prefix?: ReactNode
  required?: boolean
}
interface Model {
  account: {
    a: string
    b: string
    c: number,
    d: string
  }
}

const a = defineField<string, Props>()
  .component({
    id: "a",
    component: Input
  })
  .props({
    label: "a",
    prefix: "👤",
    required: true
  })

const b = defineField<string, Props>()
  .component({
    id: "b",
    component: Input,
  })
  .props({ label: "v", prefix: "🔒", required: true })

const c = defineField<number, Props>()
  .component({
    id: "c",
    component: Input,
  })
  .props({
    label: "c",
    prefix: "🎂",
    required: true
  })
  .relation(defineRelation([
    [
      'account.a',
      (field, aValue) => {
        console.log('c', aValue);
        return new Promise((resolve) => {
          setTimeout(() => {
            field.value = Math.floor(Math.random() * 100)
            resolve(field.value)
          }, 1000)
        })
      }
    ]
  ]))
const d = defineField<string, Props>()
  .component({
    id: "d",
    component: Input,
  })
  .props({
    label: "d",
    prefix: "🏠",
    required: true
  })

const e = defineField<any, any>()
  .component({
    id: "e",
    component: Info,
  })
  .props({
    label: "e"
  })
  .actions({
    setDefaultValue() {
      return []
    },
  })
  .relation(defineRelation([
    [
      ['account.a', 'account.c'],
      (field, [aValue, bValue]) => {
        console.log('e', aValue, bValue);
        field.value = [`C from A: ${aValue}, B: ${bValue}`]
      }
    ]
  ]))

const useraccount = defineField<Model['account'], any>()
  .component({
    component: Form,
    id: "account"
  })
  .properties([
    a,
    b,
    c,
    d,
    e
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
  resolvers: {
    validator: {
      zod: zodResolver
    }
  }
})

export default function () {
  return <App app={app} form={form} />
}
