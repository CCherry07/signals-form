import React, { useEffect, useState } from "react";
import { ReactNode } from "react";
import { Submit } from "./components/Submit";
import { Spin } from "antd";
import { effect } from "alien-deepsignals";
interface Parops {
  app: ReactNode,
  form: any
}

export function App(props: Parops) {
  const [state, setState] = useState(false)
  const [submitting, setSubmitted] = useState(false)
  const [model, setModel] = useState({} as any)
  useEffect(() => {
    effect(() => {
      setState(props.form.isUpdating.value)
      setSubmitted(props.form.submiting.value)
    })
    effect(() => {
      setModel(props.form.model)
    })
  }, [])
  return <div style={{ display: "flex" }}>
    <div style={{ marginRight: "50px" }}>
      <div style={{ marginBottom: 20 }}>
        model: {JSON.stringify(model, null, 2)}
      </div>
      <Spin spinning={state || submitting}>
        {props.app}
        <Submit form={props.form} />
      </Spin>
    </div>
  </div>
}
