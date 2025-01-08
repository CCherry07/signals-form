export * from "./resolvers/type"
// export * from "./controls/field"
export * from "./model/form"
export * from "./model/form_group"
export * from "./decorators"
export * from "./boolless"
export * from "@rxform/shared"
export {
  setup as setupValidator,
  validate
} from "./validator"
export type { ValidateItem } from "./validator"

export type * from "./model/types"

export { createTemplateLiterals as js } from "@rxform/shared"

export { VirtualField as Field } from "./controls/virtualField"
