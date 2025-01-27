import { FieldBuilder } from "../builder/field";

export const defineField = <T, P extends Record<string, any>>(): FieldBuilder => {
  return new FieldBuilder<T, P>()
}
