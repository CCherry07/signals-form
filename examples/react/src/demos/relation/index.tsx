import React from "react";
import { ReactNode } from "react";
import { createForm } from "@signals-form/react"
import { debugDependencyGraph, defineField, setupRelation } from "@signals-form/core";
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
  dependencies: 'account.a',
  update(field, aValue) {
    console.log('c', aValue);
    return new Promise((resolve) => {
      setTimeout(() => {
        field.value = Math.floor(Math.random() * 100)
        resolve()
      }, 1000)
    })
  }
});

setupRelation({
  field: e,
  dependencies: ['account.a', 'account.c'],
  update: (field, [aValue, bValue]) => {
    console.log('e', aValue, bValue);
    field.value = [`C from A: ${aValue}, B: ${bValue}`]
  }
});


setupRelation({
  field: c,
  dependencies: 'account.d',
  update(field, aValue) {
    console.log('c', aValue);
    return new Promise((resolve) => {
      setTimeout(() => {
        field.value = 40
        resolve()
      }, 1000)
    })
  }
});


// setupRelation({
//   field: a,
//   dependencies: 'account.c',
//   update: (field, cValue) => {
//     console.log("a,props", cValue);
//     field.setProp('label', `a: ${cValue}`)
//     // field.value = [`C from A: ${aValue}, B: ${bValue}`]
//   }
// });


debugDependencyGraph()

export default function () {
  return <App app={app} form={form} />
}
