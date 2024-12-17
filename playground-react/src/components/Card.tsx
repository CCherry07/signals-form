import React, { ReactNode } from 'react';
import { Card as AntdCard, Button } from "antd"
interface Props {
  children: ReactNode,
  title: string,
  onChange: (data: any) => void,
  value: any
}
export function Card(props: Props) {
  const handleChange = ()=>{
    props.onChange({
      ...props.value,
      addr:{
        ...props.value.addr,
        districtAndCounty:"朝阳区",
      }
    })
  }
  return <AntdCard style={{ width: "400px" }}>
    <h1>{props.title}</h1>
    {
      props.children
    }
    <Button onClick={handleChange}> Root full addr </Button>
  </AntdCard>;
}
