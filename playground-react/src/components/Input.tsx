import React from 'react';
interface Props {
  errors: any;
  value: any
  onChange: any
}
export default function Budget(props: Props) {
  const { onChange, value, errors } = props
  return <div>
    <h1>input {value}</h1>
    <input value={value} type="text" onChange={onChange} />
    <div>{JSON.stringify(errors)}</div>
  </div>
}
