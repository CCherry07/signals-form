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
  | "getField" | 'getFieldValues'
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


export interface ComponentOptions<P extends Record<string, any>> {
  id: string;
  component?: any;
  wrapper?: any;
  hidden?: Decision;
  disabled?: Decision;
  removeValueOnHidden?: boolean
  recoverValueOnShown?: boolean
  props: P;
  properties?: FieldBuilder[]
}

export interface ActionOptions<T> {
  setDefaultValue?: (data?: any) => any;
  onSubmitValue?: (model: T) => any;
}

export interface ValidatorOptions {
  passive?: ValidateItem[] | ValidateItem;
  initiative?: ValidateItem[] | ValidateItem | Object;
}

export interface FieldError {
  message: string
  type: string
}
export type FieldErrors = Record<string, FieldError>

export interface Lifecycle<T, P extends Object> {
  onBeforeInit?(this: FieldBuilder<T, P>): void
  onInit?(this: FieldBuilder<T, P>): void
  onDestroy?(this: FieldBuilder<T, P>): void
  onDisabled?(this: FieldBuilder<T, P>, state: boolean): void
  onHidden?(this: FieldBuilder<T, P>, state: boolean): void
  onMounted?(this: FieldBuilder<T, P>): void
  onUnmounted?(this: FieldBuilder<T, P>): void
  onValidate?(this: FieldBuilder<T, P>): void
}

type PickKeys = "value" | "getProps" | "getAppContext" | "getProvides" | "boolContext" | "isRoot" | "isLeaf" | "evaluateDecision" | "setFieldErrors" | "cleanErrors" | "setErrors"
export type Field = Pick<FieldBuilder, PickKeys>
