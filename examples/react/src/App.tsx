import React, { useEffect, useState } from "react";
import { ReactNode } from "react";
import { Submit } from "./components/Submit";
import { effect } from "alien-signals";
import { Spin } from "antd";
interface Parops {
  apps: ReactNode[],
  forms: any[]
}
export function App(props: Parops) {
  const [state, setState] = useState(false)
  const [submitting, setSubmitted] = useState(false)
  const [model, setModel] = useState({} as any)
  useEffect(() => {
    effect(() => {
      setState(props.forms[0].isUpdating.value)
      setSubmitted(props.forms[0].submiting.value)
    })
    effect(() => {
      setModel(props.forms[0].model.value)
    })
  }, [])
  return <div style={{ display: "flex" }}>
    {
      props.apps.map((Node, index) => {
        return <div key={index} style={{ marginRight: "50px" }}>
          <div style={{ marginBottom: 20 }}>
            model: {JSON.stringify(model, null, 2)}
          </div>
          <Spin spinning={state || submitting}>
            {Node}
            <Submit form={props.forms[0]}/>
          </Spin>
        </div>
      })
    }
  </div>
}
