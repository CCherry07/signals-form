import React from "react"
import { Space, Typography } from 'antd';
export function Info({
  value
}: { value: string[] }) {
  return <Space direction="vertical">
    {
      value.map((v, i) => <Typography.Text key={i}>{v}</Typography.Text>)
    }
  </Space>
}
