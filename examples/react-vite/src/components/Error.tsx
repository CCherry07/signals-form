import { FieldErrors } from "@rxform/core/validator";
import React from "react";

export function FieldError({
  errors
}: {
  errors: FieldErrors
}) {
  return <div>
    <div style={{ color: "red" }}>
      {Object.entries(errors).map(([key, value]) => {
        return <div key={key} color='red'> {value.message}</div>
      })}
    </div>
  </div>;
}
