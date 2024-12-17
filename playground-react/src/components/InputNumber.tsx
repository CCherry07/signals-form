import { Form, InputNumber } from "antd"
import React from "react";
import { FieldError } from "./Error";
interface Props {
  errors: any;
  value: any
  onChange: any
  type: "number" | "text",
  title: string
  isDisabled: boolean
}
export default function (props: Props) {
  const { onChange, value, errors, title, isDisabled } = props;
  return <Form.Item label={title}>
    <InputNumber style={{width:"100%"}} disabled={isDisabled} value={value} onChange={onChange} />
    <FieldError errors={errors} />
  </Form.Item>
}
