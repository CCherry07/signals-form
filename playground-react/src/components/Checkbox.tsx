import React from 'react';
interface Props {
  errors: any;
  value: any
  onChange: any
  type: "number" | "text" | "checkbox",
  title: string
}
export default function Checkbox(props: Props) {
  const { onChange, value, errors, type, title } = props
  return <div>
    <h1>{title} {value}</h1>
    <input type={type} value={value} onChange={(e) => {
      onChange(e.target.checked)
    }} />
    <div style={{ color: "red" }}>{JSON.stringify(errors)}</div>
  </div>
}
