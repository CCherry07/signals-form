import React from 'react';
import { Checkbox, Form } from "antd"
import { FieldError } from './Error';
interface Props {
  errors: any;
  value: any
  onChange: any
  label: string
}
export default function (props: Props) {
  const { onChange, value, label, errors } = props
  return <div>
    <Form.Item label={label}>
      <Checkbox checked={value} onChange={(e) => {
        onChange(e.target.checked)
      }} />
      <FieldError errors={errors} />
    </Form.Item>
  </div>
}
