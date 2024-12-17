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
  const handleUpdateModel = () => {
    from.updateModel({
      userinfo: {
        name: "test",
        age: 20
      }
    });
  }
  const handleMergeModel = () => {
    from.mergeModel({
      userinfo: {
        name: "test1",
      }
    });
  }
  return <Space style={{ marginTop: 20 }}>
    <Button onClick={handleSubmit}>submit</Button>
    <Button onClick={handleUpdateModel}>update model</Button>
    <Button onClick={handleMergeModel}>merage model</Button>
  </Space>
}
