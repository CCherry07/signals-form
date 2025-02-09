import { Cascader, Form } from "antd"
import React from "react";
import { FieldError } from "./Error";

export default function (props: any) {
  const { label, value, onChange, options, required } = props;
  return (
    <Form.Item label={label} required={required}>
      <Cascader
        value={value}
        onChange={onChange}
        options={options}
      />
      <FieldError errors={props.errors} />
    </Form.Item>
  )
}
