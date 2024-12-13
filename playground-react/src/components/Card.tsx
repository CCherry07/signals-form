import React, { ReactNode } from 'react';
import { Card as AntdCard } from "antd"
interface Props {
  children: ReactNode,
  title: string,
}
export function Card(props: Props) {
  return <AntdCard>
    <h1>{props.title}</h1>
    {
      props.children
    }
    </AntdCard>;
}
