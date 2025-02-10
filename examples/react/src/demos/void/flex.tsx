import { Flex as AntdFlex } from "antd"
import React from "react"

export function Flex ({
  children,
  ...props
}: any) {
  const {
    style,
    ...rest
  } = props
  return <AntdFlex style={style}>
    {children}
  </AntdFlex>
}
