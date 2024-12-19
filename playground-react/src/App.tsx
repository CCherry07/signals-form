import React, { useEffect, useState } from "react";
import { ReactNode } from "react";
import { Submit } from "./components/Submit";
import { effect } from "@preact/signals-core";
import { Spin } from "antd";
interface Parops {
  app: ReactNode,
  from: any
}
export function App(props: Parops) {
  const [state, setState] = useState(false)
  useEffect(() => {
    effect(() => {
      setState(props.from.isPending.value)
    })
  }, [])
  return <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh" }}>
    <Spin spinning={state}>
      {props.app}
      <Submit from={props.from} />
    </Spin>
  </div>
}
