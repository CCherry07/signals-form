import { BoolsConfig, BoolContext, Decision} from "../boolless";
import { Resolver } from "./resolvers";
import { Signal } from "alien-deepsignals";
import { FieldBuilder } from "../builder/field";
import { ValidateItem } from "./validator";

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

export interface AbstractModelInitOptions<M extends Model> {
  defaultValidatorEngine: string;
  boolsConfig: BoolsConfig<M>
  graph: FieldBuilder[]
  fields: Record<string, FieldBuilder>
}

export interface AbstractModelConstructor {
  provides?: Record<string, any>
}

export interface ComponentOptions<T> {
  id?: string;
  type?: FieldBuilderType
  component?: any;
  wrapper?: any;
  hidden?: Decision
  disabled?: Decision
  removeValueOnHidden?: boolean
  recoverValueOnShown?: boolean
  initialValue?: () => T | T | Promise<T>
}

export interface ActionOptions<T, P extends Object> {
  setDefaultValue?: (this: FieldBuilder<T, P>) => T | Promise<T>;
  onSubmitValue?: (this: FieldBuilder<T, P>, model: T) => any;
}

export interface ValidatorOptions<T> {
  passive?: Omit<ValidateItem<T>, 'updateOn'>[] | Omit<ValidateItem<T>, 'updateOn'>;
  initiative?: ValidateItem<T>[] | ValidateItem<T> | Object;
}

export type ValidateType = "passive" | "initiative"

export interface FieldError {
  message: string
  type: string
}

export type FieldErrors = {
  /** event driven verification */
  initiative?: Record<string, FieldError>,
  /** status drive verification */
  passive?: Record<string, FieldError>,
}

export type ValidateMode = "initiative" | "passive"

export type FieldBuilderType = "Field" | "Void"

type ReadonlyPickKeys = "getProps" | "getAppContext" |
  "getProvides" | "isRoot" | "isLeaf" |
  "execDecision" | "setFieldErrors" | "cleanErrors" |
  "setErrors" | "peek" | "setProp" | "isHidden" | "updateValue"|
  "isDisabled" | "isBlurred" | "isFocused" | "isMounted" | "setValue"|
  "isDestroyed" | "isInitialized" | "updateProperties" | "getProperties"

type PickKeys = "value" | "errors"

export type Field<T extends FieldBuilder<any, any>> = Readonly<Pick<T, ReadonlyPickKeys>> & Pick<T, PickKeys>

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
}

export enum ValueStatus {
  Commiting = "Commiting",
  Pending = "Pending",
  Committed = "Committed",
  Failed = "Failed",
}
