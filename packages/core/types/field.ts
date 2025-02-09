import { BoolsConfig, BoolContext, Decision } from "../boolless";
import { AbstractModel } from "../model/abstract_model";
import { Resolver } from "../resolvers/type";
import { DeepSignal, Signal } from "alien-deepsignals";
import { FieldBuilder } from "../builder/field";
import { ValidateItem } from "../validator/types";

export interface FormConfig {
  graph: typeof FieldBuilder[];
  defaultValidatorEngine: string;
  boolsConfig: Record<string, (...args: any[]) => boolean>;
  id: string;
  resolvers?: {
    validator?: Record<string, Resolver>
  }
}

export type Model = Record<string, any>;

export interface SubscribeProps<M> {
  bools: BoolContext;
  submitted: Signal<boolean>;
  errors: Record<string, FieldErrors>;
  model: M;
  isUpdating: Signal<boolean>
}

export type AbstractModelMethods = Pick<AbstractModel<DeepSignal<Model>>,
  'getFieldValue' | 'setFieldValue' | 'setFieldErrors' | 'setErrors'
  | 'cleanErrors' | 'onSubscribe' | "peekFieldValue"
  | "getField" | 'getFieldsValue' | "getFieldValueStatus" | 'addField'
>

export interface AbstractModelInitOptions<M extends Model> {
  defaultValidatorEngine: string;
  boolsConfig: BoolsConfig<M>
  graph: FieldBuilder[]
  fields: Record<string, FieldBuilder>
}

export interface AbstractModelConstructor {
  provides?: Record<string, any>
}

export interface ComponentOptions {
  id: string;
  component?: any;
  wrapper?: any;
  hidden?: Decision;
  disabled?: Decision;
  removeValueOnHidden?: boolean
  recoverValueOnShown?: boolean
}

export interface ActionOptions<T> {
  setDefaultValue?: () => T | Promise<T>;
  onSubmitValue?: (model: T) => any;
}

export interface ValidatorOptions {
  passive?: ValidateItem[] | ValidateItem;
  initiative?: ValidateItem[] | ValidateItem | Object;
}

export type ValidateType = "passive" | "initiative"

export interface FieldError {
  message: string
  type: string
}
export type FieldErrors = Record<string, FieldError>

type ReadonlyPickKeys = "getProps" | "getAppContext" |
  "getProvides" | "boolContext" | "isRoot" | "isLeaf" |
  "execDecision" | "setFieldErrors" | "cleanErrors" |
  "setErrors" | "peek" | "setProp" | "isHidden" |
  "isDisabled" | "isBlurred" | "isFocused" | "isMounted" |
  "isDestroyed" | "isInitialized"

type PickKeys = "value" | "errors"

export type Field<T extends FieldBuilder> = Readonly< Pick<T, ReadonlyPickKeys>> & Pick<T, PickKeys>

export interface Lifecycle<T, P extends Object> {
  onDestroy?(this: Field<FieldBuilder<T, P>>): void
  onDisabled?(this: Field<FieldBuilder<T, P>>, isDisabled: boolean): void
  onValidate?(this: Field<FieldBuilder<T, P>>, type: ValidateType, errors: FieldErrors): void

  onBeforeInit?(this: Field<FieldBuilder<T, P>>): void
  onInit?(this: Field<FieldBuilder<T, P>>): void
  onHidden?(this: Field<FieldBuilder<T, P>>, isHidden: boolean): void
  onMounted?(this: Field<FieldBuilder<T, P>>): void
  onUnmounted?(this: Field<FieldBuilder<T, P>>): void
}

export interface BaseFieldProps<T> {
  errors: FieldErrors
  value: T,
  isHidden: boolean,
  isDisabled: boolean,
  isBlurred: boolean,
  isFocused: boolean,
  isMounted: boolean,
  isDestroyed: boolean,
  isInitialized: boolean,
  isUpdating: boolean,
}
