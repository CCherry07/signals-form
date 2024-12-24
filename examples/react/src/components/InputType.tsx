import React, { useMemo } from 'react';
import { Input as AInput, Form } from "antd"
import { FieldError } from './Error';
interface Props {
  errors: any;
  value: any
  onChange: any
  title: string
  isDisabled: boolean
  onBlur: Function
  onFocus: Function
  type: "Group" | "Search" | "TextArea" | "Password" | "OTP";
}
export default function (props: Props) {
  const { onChange, value, errors, title, isDisabled, type } = props
  const Node = useMemo(() => {
    switch (type) {
      case "Group":
        return AInput.Group
      case "Search":
        return AInput.Search
      case "TextArea":
        return AInput.TextArea
      case "Password":
        return AInput.Password
      case "OTP":
        return AInput.OTP
      default:
        return AInput
    }
  }, [type])
  return <div>
    <Form.Item label={title}>
      <Node disabled={isDisabled} value={value}
        onChange={(e) => {
          // @ts-ignore
          onChange(e?.target?.value ?? e)
        }} />
      <FieldError errors={errors} />
    </Form.Item>
  </div>
}
