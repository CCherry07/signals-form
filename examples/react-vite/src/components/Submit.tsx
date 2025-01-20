import React from "react";
import { Button, Space } from "antd"
interface Props {
  form: any;
}
let idx = 1
export function Submit(props: Props) {
  const { form } = props;
  const handleSubmit = (e: any) => {
    e.preventDefault();
    form.submit().then((res: any) => {
      console.log("form model", res);
    }).catch((err: any) => {
      console.log("form model", err);
    });
  };
  return <Space style={{ marginTop: 20 }}>
    <Button variant="filled" type="primary" onClick={handleSubmit}>submit</Button>
    <Button variant="filled" type="primary" onClick={() => form.reset()}>reset</Button>
    <Button onClick={() => form.useOrCreateModel(++idx)}> add Model </Button>
    <Button onClick={() => form.useOrCreateModel(2)}> use Model </Button>
  </Space>
}
