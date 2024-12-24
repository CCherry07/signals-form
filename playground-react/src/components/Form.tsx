import { Form } from "antd"
import React from "react";

export default function (props: any) {
  const { children,style } = props;
  console.log(children);
  
  return (
    <Form style={style}>
      {children}
    </Form>
  )
}
