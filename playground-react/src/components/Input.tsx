import React from 'react';
export default function Budget(props: { onChange: any; value: any; }) {
  const { onChange, value } = props
  return <div>
    <h1>Hello, React 19!</h1>
    <input value={value} type="text" onChange={onChange} />
  </div>
}
