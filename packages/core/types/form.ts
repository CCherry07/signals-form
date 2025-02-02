import type {AbstractModel} from "../model/abstract_model";
import {BoolsConfig, BoolContext} from "../boolless";
import {Resolver} from "../resolvers/type";
import {DeepSignal, Signal} from "alien-deepsignals";
import { FieldBuilder } from "../builder/field";
import { FieldErrors } from "./field";

export interface FormConfig {
  graph: FieldBuilder[];
  defaultValidatorEngine: string;
  boolsConfig: Record<string, (...args: any[]) => boolean>;
  id: string;
  resolvers?: {
    validator?: Record<string, Resolver>
  }
}

export type Model = Record<string, any>;


export interface SubscribeProps<M> {
  boolContext: BoolContext;
  submitted: Signal<boolean>;
  errors: Record<string, FieldErrors>;
  model: M;
  isUpdating: Signal<boolean>
}

export type AbstractModelMethods = Pick<AbstractModel<DeepSignal<Model>>,
    'getFieldValue' | 'setFieldValue' | 'setFieldErrors' | 'setErrors'
    | 'cleanErrors' | 'onSubscribe' | "peekFieldValue"
    | "getField" | "getFieldValues"
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

export interface Lifecycle <M extends Model>{
  onBeforeInit?(this: AbstractModel<M>): void
  onInit?(this: AbstractModel<M>): void
  onDestroy?(this: AbstractModel<M>): void
  onDisabled?(this: AbstractModel<M>, state: boolean): void
  onHidden?(this: AbstractModel<M>, state: boolean): void
  onMounted?(this: AbstractModel<M>): void
  onUnmounted?(this: AbstractModel<M>): void
  onValidate?(this: AbstractModel<M>): void
}
