import React, { useEffect, useState } from "react";
import { ReactNode } from "react";
import { Submit } from "./components/Submit";
import { effect } from "@preact/signals-core";
import { Spin } from "antd";
import { toDeepValue } from "@rxform/core";
interface Parops {
  app: ReactNode,
  form: any
}
export function App(props: Parops) {
  const [state, setState] = useState(false)
  const [submiting, setSubmitted] = useState(false)
  const [model, setModel] = useState({} as any)
  useEffect(() => {
    effect(() => {
      setState(props.form.isPending.value)
      setSubmitted(props.form.submiting.value)
    })
    effect(() => {
      setModel(toDeepValue(props.form.model.value))
    })
  }, [])
  return <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh" }}>
    <div style={{ marginBottom: 20 }}>
      model: {JSON.stringify(model, null, 2)}
    </div>
    <Spin spinning={state || submiting}>
      {props.app}
      <Submit form={props.form} />
    </Spin>
  </div>
}
