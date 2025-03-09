import React from "react";
import { ReactNode } from "react";
import { createForm } from "@signals-form/react"
import { defineField, setupRelation } from "@signals-form/core";
import { zodResolver } from "@signals-form/resolvers";
import Form from "../../components/Form";
import Input from "../../components/Input";
import { App } from "./app"
import { Info } from "./info"
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

setupRelation({
  field: c,
  dependencies: a,
  update() {
    return Math.floor(Math.random() * 100)
  },
});

setupRelation({
  field: e,
  dependencies: [c],
  update: (field, cValue) => {
    const aValue = field.getAbstractModel().getField('account.a').value
    const str = aValue + cValue
    console.log('e', str);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          `a: ${aValue}, c: ${cValue}`
        ])
      }, 1000)
    })
  }
});

setupRelation({
  field: a,
  dependencies: [e],
  update: (field, eValue) => {
    console.log('a', eValue);
    field.setState('label', eValue[0])
  }
});

export default function () {
  return <App app={app} form={form} />
}
