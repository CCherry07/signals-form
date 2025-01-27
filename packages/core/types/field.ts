import { BoolsConfig, BoolContext, Decision } from "../boolless";
import { AbstractModel } from "../model/abstract_model";
import { Resolver } from "../resolvers/type";
import { DeepSignal, Signal } from "alien-deepsignals";
import { ValidateItem } from "../validator";
import { FieldBuilder } from "../builder/field";

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
  | "getField"
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
  props: Record<string, any>;
  properties?: FieldBuilder[]
}

export interface ActionOptions<T> {
  setDefaultValue?: (data?: any) => any;
  onSubmitValue?: (model: T) => any;
}

export interface ValidatorOptions {
  signal?: ValidateItem[];
  initiative?: ValidateItem[];
}

export interface FieldError {
  message: string
  type: string
}
export type FieldErrors = Record<string, FieldError>
