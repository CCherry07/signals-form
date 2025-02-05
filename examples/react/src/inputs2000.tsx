import React from 'react';
import { createRoot } from 'react-dom/client';
import Input from "./components/Input"
import { createForm } from "@formula/react"
import { FieldBuilder } from "@formula/core"
import { App } from "./App1"

const graph = Array.from({ length: 2000 }).map((_, i) => {
  return new FieldBuilder().component({
    id: `input${i}`,
    component: Input,
    props: {
      label: `Input ${i}`
    }
  }).build()
}) as any[]

const { app, form } = createForm({
  defaultValidatorEngine: "zod",
  boolsConfig: {},
  graph,
  id: 'form1',
  components: {
    input: Input,
  }
})

const root = createRoot(document.getElementById('root')!);
root.render(<App app={app} form={form} />);
