import React, { useMemo } from 'react';
import { Form, Input } from "antd"
import { FieldError } from './Error';
interface Props {
  errors: any;
  value: any
  onChange: any
  label: string
  isDisabled: boolean
  onBlur: Function
  onFocus: Function
  type?: "Group" | "Search" | "TextArea" | "Password" | "OTP";
  required?: boolean
}
export default function FieldInput(props: Props) {
  const { onChange, value, errors, label, isDisabled, type, required, ...other } = props

  const Node = useMemo(() => type ? Input[type] : Input, [type])
  return <div>
    <Form.Item label={label} required={required}>
      {/* @ts-ignore */}
      <Node disabled={isDisabled} value={value} {...other}
        onChange={(e) => {
          let value = undefined
          if (typeof e === 'string') {
            value = e
          } else if (e?.target?.value) {
            value = e?.target?.value ?? e
          }
          onChange(value)
        }} />
      <FieldError errors={errors} />
    </Form.Item>
  </div>
}
