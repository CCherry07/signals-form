import React, { useEffect, useState } from "react";
import { ReactNode } from "react";
import { Submit } from "./components/Submit";
import { effect } from "@preact/signals-core";
import { Space, Spin } from "antd";
import { toDeepValue } from "@rxform/core";
interface Parops {
  app: ReactNode,
  from: any
}
export function App(props: Parops) {
  const [state, setState] = useState(false)
  const [model, setModel] = useState({} as any)
  useEffect(() => {
    effect(() => {
      setState(props.from.isPending.value)
    })
    effect(() => {
      setModel(toDeepValue(props.from.model.value))
    })
  }, [])
  return <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh" }}>
    <div style={{ marginBottom: 20 }}>
      model: {JSON.stringify(model, null, 2)}
    </div>
    <Spin spinning={state}>
      {props.app}
      <Submit from={props.from} />
    </Spin>
  </div>
}
