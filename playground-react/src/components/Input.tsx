import React from 'react';
interface Props {
  errors: any;
  value: any
  onChange: any
  type: "number" | "text",
  title: string
}
export default function Budget(props: Props) {
  const { onChange, value, errors, type, title } = props
  return <div>
    <h1>{title} {value}</h1>
    <input type={type} value={value} onChange={(e) => {
      const value = type === "number" ? Number(e.target.value) : e.target.value
      onChange(value)
    }} />
    <div style={{ color: "red" }}>{JSON.stringify(errors)}</div>
  </div>
}
