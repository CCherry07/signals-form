// @ts-nocheck
import { Decision } from "../boolless";
import { Field } from "../controls/field";
import { METADATA_COMPONENT, METADATA_ACTIONS, METADATA_VALIDATOR, METADATA_CONDITIONS, METADATA_PROPS } from "./metaKeys";

export interface ComponentMetaData {
  id: string;
  component?: any;
  hidden?: Decision;
  disabled?: Decision;
  props?: Record<string, any>;
  recoverValueOnHidden?: boolean
  recoverValueOnShown?: boolean
  properties?: (typeof Field | Field)[]
}
 function initFieldMetaDate(constructor:any) {
    // const componentMeta = constructor[Symbol.metadata][METADATA_COMPONENT] ?? {}
    const actions = constructor[Symbol.metadata][METADATA_ACTIONS] ?? {}
    const validatorMeta = { validator: constructor[Symbol.metadata][METADATA_VALIDATOR] ?? {} }
    const conditions = constructor[Symbol.metadata][METADATA_CONDITIONS] ?? {}
    const props = constructor[Symbol.metadata][METADATA_PROPS] ?? {}
    // this.$effects = Object.values(conditions);
    // const properties = (componentMeta.properties ??= []).map((Property: typeof Field) => new Property());
    // componentMeta.properties = properties

    // Object.assign(this, componentMeta, actions, validatorMeta, props)
    return {
      actions,
      validatorMeta,
      conditions,
      props
    }
  }
export function Component(metadata: ComponentMetaData) {
  return function (target: Function, _ctx: ClassDecoratorContext) {
    // ctx.metadata![METADATA_COMPONENT] = metadata
    const proto = target.prototype
    console.log(target,proto);

    const superProto = Object.getPrototypeOf(target.prototype)
    // @ts-ignore
    const Super = (superProto instanceof Field
      ? superProto.constructor
      : Field) as typeof Field    

      const data = initFieldMetaDate(proto.constructor)
      console.log(data);
      
      // @ts-ignore
      const f = Super.extend(metadata)
      console.log(f);
      
  };
}
