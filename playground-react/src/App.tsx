import React from "react";
import { ReactNode } from "react";
import { Submit } from "./components/Submit";
interface Parops {
  app: ReactNode,
  from: any
}
export function App(props:Parops) {
  return <div>
    {props.app}
    <Submit from={props.from} />
  </div>
}
