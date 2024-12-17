import React from "react";
import { Button, Space } from "antd"
interface Props {
  from: any;
}
export function Submit(props: Props) {
  const { from } = props;
  const handleSubmit = (e: any) => {
    e.preventDefault();
    from.submit().then((res: any) => {
      console.log("form model", res);
    }).catch((err: any) => {
      console.log("form model", err);
    });
  };
  return <Space style={{ marginTop: 20 }}>
    <Button variant="filled" type="primary" onClick={handleSubmit}>submit</Button>
  </Space>
}
