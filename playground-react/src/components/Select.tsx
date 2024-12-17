import { Form, Select } from "antd"
import React from "react";
import { FieldError } from "./Error";
const { Option } = Select

export default function (props: any) {
  const { title, value, onChange, options, } = props;
  return (
    <Form.Item label={title}>
      <Select
        value={value}
        onChange={onChange}
      >
        {options.map((option: any) => (
          <Option key={option.value} value={option.value}>{option.label}</Option>
        ))}
      </Select>
      <FieldError errors={props.errors} />
    </Form.Item>
  )
}
