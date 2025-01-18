import { Form, Select } from "antd"
import React from "react";
import { FieldError } from "./Error";

export default function (props: any) {
  const { label, value, onChange, options, } = props;
  return (
    <Form.Item label={label}>
      <Select
        value={value}
        onChange={onChange}
      >
        {options.map((option: any) => (
          <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>
        ))}
      </Select>
      <FieldError errors={props.errors} />
    </Form.Item>
  )
}
