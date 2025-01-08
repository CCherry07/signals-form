// @ts-nocheck
import { Field } from "./field"
export const VirtualField = class {
  static extend(...args: any){
    return Field.extend(...args)
  }
} as typeof Field
