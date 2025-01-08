// @ts-nocheck
import { Decision } from "../boolless";
import { VirtualField } from "../controls/virtualField";
import { METADATA_ACTIONS, METADATA_VALIDATOR, METADATA_CONDITIONS } from "./metaKeys";
function initFieldMetaDate(target: any) {
  const actions = target[Symbol.metadata][METADATA_ACTIONS] ?? {}
  const validator = target[Symbol.metadata][METADATA_VALIDATOR] ?? {}
  const conditions = target[Symbol.metadata][METADATA_CONDITIONS] ?? {}
  // const props = target[Symbol.metadata][METADATA_PROPS] ?? {}
  const $effects = Object.values(conditions);
  // const properties = (componentMeta.properties ??= []).map((Property: typeof Field) => new Property());

  // Object.assign(this, actions, validatorMeta, props)
  return {
    actions,
    validator,
    conditions,
    $effects
  }
}
export interface ComponentMetaData {
  id: string;
  component?: any;
  hidden?: Decision;
  disabled?: Decision;
  props?: Record<string, any>;
  recoverValueOnHidden?: boolean
  recoverValueOnShown?: boolean
  properties?: (typeof VirtualField)[]
}

export function Component(metadata: ComponentMetaData): ClassDecoratorFunction {
  return function (target: Function, ctx: ClassDecoratorContext) {
    const superProto = Object.getPrototypeOf(target.prototype)
    const Super = (superProto instanceof VirtualField
      ? superProto.constructor
      : VirtualField) as typeof VirtualField
    const field = Super.extend(metadata)
    const base = new target()
    ctx.addInitializer(function () {
      const data = initFieldMetaDate(this)
      Object.assign(field, base, data)
    })
    return function () {
      return field
    }
  };
}
