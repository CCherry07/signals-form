import { Divider as AntdDivider } from "antd"
import React from "react"

export function Divider ({
  children,
  ...props
}: any) {
  const {
    style,
    ...rest
  } = props
  return <AntdDivider style={style}>
    {children}
  </AntdDivider>
}
