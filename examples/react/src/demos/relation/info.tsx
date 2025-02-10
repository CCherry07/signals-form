import React from "react"
import { Form, Space, Typography } from 'antd';
export function Info({
  value,
  label
}: { value: string[], label: string }) {
  return <Form.Item label={label}>
    <Space direction="vertical">
      {
        value.length ? value.map((v, i) => <Typography.Text key={i}>{v}</Typography.Text>) : "暂无"
      }
    </Space>
  </Form.Item>
}
