import React from "react";
import { ReactNode } from "react";
import { Submit } from "./components/Submit";
interface Parops {
  app: ReactNode,
  from: any
}
export function App(props: Parops) {
  return <div style={{ display: "flex", flexDirection:"column", justifyContent: "center", alignItems: "center", height: "100vh" }}>
    {props.app}
    <Submit from={props.from} />
  </div>
}
