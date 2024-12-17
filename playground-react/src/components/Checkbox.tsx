import React from 'react';
import { Checkbox, Form } from "antd"
import { FieldError } from './Error';
interface Props {
  errors: any;
  value: any
  onChange: any
  title: string
}
export default function (props: Props) {
  const { onChange, value, title, errors } = props
  return <div>
    <Form.Item label={title}>
      <Checkbox checked={value} onChange={(e) => {
        onChange(e.target.checked)
      }} />
      <FieldError errors={errors} />
    </Form.Item>
  </div>
}
