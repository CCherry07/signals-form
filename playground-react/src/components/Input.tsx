import React from 'react';
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
  type?: "Group" | "Search" | "TextArea" | "Password" | "OTP" ;
}
export default function (props: Props) {
  const { onChange, value, errors, title, isDisabled, onBlur, onFocus , type } = props
  return <div>
    <Form.Item label={title}>
      <AInput disabled={isDisabled} value={value}
        onFocus={() => {
          onFocus()
        }}
        onBlur={(e) => {
          onBlur(e.target?.value  ?? e)
        }}
        onChange={(e) => {
          onChange(e?.target?.value ?? e)
        }} />
      <FieldError errors={errors} />
    </Form.Item>
  </div>
}
