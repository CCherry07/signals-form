import { FieldErrors } from "@formula/core/types/field";
import React from "react";

export function FieldError({
  errors
}: {
  errors: FieldErrors
}) {
  const { initiative, passive } = errors
  return <div>
    <div style={{ color: "red" }}>
      {Object.entries({...initiative,...passive}).map(([key, value]) => {
        return <div key={key} color='red'> {value.message}</div>
      })}
    </div>
  </div>;
}
