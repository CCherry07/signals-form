import React, { useEffect, useState } from "react";
import { ReactNode } from "react";
import { Submit } from "./components/Submit";
import { effect } from "@preact/signals-core";
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
    {props.app}
    {String(state)}
    <Submit from={props.from} />
  </div>
}
