import { FieldBuilder } from "../builder/field";

export const defineField = <T, P extends Record<string, any>>() => {
  return new FieldBuilder<T, P>();
}
