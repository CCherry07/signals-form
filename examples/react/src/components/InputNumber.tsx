import { Form, InputNumber } from "antd"
import React from "react";
import { FieldError } from "./Error";
interface Props {
  errors: any;
  value: any
  onChange: any
  type: "number" | "text",
  label: string
  isDisabled: boolean
  required: boolean
}
export default function (props: Props) {
  const { onChange, value, errors, label, required, isDisabled } = props;
  return <Form.Item label={label} required={required}>
    <InputNumber style={{ width: "100%" }} disabled={isDisabled} value={value} onChange={onChange} />
    <FieldError errors={errors} />
  </Form.Item>
}
