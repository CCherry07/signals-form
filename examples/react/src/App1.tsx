import React from "react";
import { ReactNode } from "react";
interface Parops {
  app: ReactNode,
  form: any
}
export function App(props: Parops) {
  return <div style={{ display: "flex" }}>
    {
      props.app
    }
  </div>
}
