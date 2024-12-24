import { Cascader, Form } from "antd"
import React from "react";
import { FieldError } from "./Error";

export default function (props: any) {
  const { title, value, onChange, options } = props;
  return (
    <Form.Item label={title}>
      <Cascader
        value={value}
        onChange={onChange}
        options={options}
      />
      <FieldError errors={props.errors} />
    </Form.Item>
  )
}
