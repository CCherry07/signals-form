import { Button } from "antd";
import React from "react";

export default function ({ children, onChange }) {
  const handleChange = () => {
    onChange({
      city: "北京市"
    })
  }
  return <div>
    <h3>Addr</h3>
    {children}
    <Button onClick={handleChange}> 填充Addr </Button>
  </div>
}
