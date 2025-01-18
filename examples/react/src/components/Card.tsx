import React, { ReactNode } from 'react';
import { Card as AntdCard } from "antd"
interface Props {
  children: ReactNode,
  label: string,
  onChange: (data: any) => void,
  value: any
}
export function Card(props: Props) {
  return <AntdCard style={{ width: "400px" }}>
    {
      props.children
    }
  </AntdCard>;
}
