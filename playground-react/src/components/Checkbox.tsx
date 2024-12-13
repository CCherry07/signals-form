import React from 'react';
import { Checkbox, Form } from "antd"
interface Props {
  errors: any;
  value: any
  onChange: any
  type: "number" | "text" | "checkbox",
  title: string
}
export default function (props: Props) {
  const { onChange, value, title } = props
  return <div>
    <Form.Item label={title}>
      <Checkbox checked={value} onChange={(e)=>{
        onChange(e.target.checked)
      }} />
    </Form.Item>
  </div>
}
