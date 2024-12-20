import { FieldErrors } from "../validator/error/field";
import { BoolsConfig, setup, type BoolValues } from "../boolless"
import { batch, effect, Signal, signal } from "@preact/signals-core";
import { get, set } from "@rxform/shared";
import { Field, FiledUpdateType } from "../controls/field";
export type Model = Record<string, any>;
export interface AbstractModel<M extends Signal<Model>> {
  bools: BoolValues;
  submitted: Signal<boolean>;
  errors: Record<string, FieldErrors>;
  model: M;
  validatorEngine: string;
  defaultValidatorEngine: string;
  graph: Record<string, Field>
  fields: Record<string, Field>
  isPending: Signal<boolean>
}

interface SubscribeProps<M> {
  bools: BoolValues;
  submitted: Signal<boolean>;
  errors: Record<string, FieldErrors>;
  model: M;
  isPending: Signal<boolean>
}

export interface AbstractModelMathods<M extends Signal<Model>> {
  updateModel(model: M): void;
  setErrors(errors: Record<string, FieldErrors>): void;
  cleanErrors(paths?: string[]): void
  setFieldValue(field: string, value: any): void;
  getFieldValue(field: string): any;
  setFieldProps(field: string, props: any): void;
  getFieldError(field: string): FieldErrors;
  validate(): Promise<boolean>;
  validateField(field: string): Promise<boolean>;
  validateFields(fields: string[]): Promise<boolean>;
  validateFieldsAndScroll(fields: string[]): Promise<boolean>;
  validateFieldsAndScrollToFirstError(fields: string[]): Promise<boolean>;
  /**
   * 
   * @param fn 收集依赖的函数，在依赖变化时执行，返回一个清理函数，用于取消订阅
   * @param deps 依赖数组，当依赖变化时，重新执行 fn
   */
  onSubscribe(fn: (props: SubscribeProps<M>) => void): () => void;
  reset(): void;
  submit(): Promise<Model>;
}
export type AbstractModelMethods = Pick<AbstractModelMathods<Signal<Model>>, 'setFieldValue' | 'setErrors' | 'setFieldProps' | 'cleanErrors' | 'onSubscribe'>

export interface AbstractModelConstructorOptions<M extends Model> {
  validatorEngine: string;
  defaultValidatorEngine: string;
  boolsConfig: BoolsConfig<M>
  model?: M
  graph?: Record<string, Field>
  fields?: Record<string, Field>
}

export class AbstractModel<M> implements AbstractModel<M> {
  constructor() {
    this.isPending = signal(false)
  }
  onSubscribe(fn: (props: SubscribeProps<M>) => void) {
    return effect(() => {
      const cleanup = fn({
        bools: this.bools,
        submitted: this.submitted,
        errors: this.errors,
        model: this.model,
        isPending: this.isPending
      })
      return cleanup;
    })
  };
  init(options: AbstractModelConstructorOptions<M>) {
    const { validatorEngine, defaultValidatorEngine, boolsConfig, model = {}, graph, fields } = options;
    this.submitted = signal(false);
    this.errors = {};
    this.model = model as M;
    this.validatorEngine = validatorEngine;
    this.defaultValidatorEngine = defaultValidatorEngine
    this.bools = setup(boolsConfig, this.model)
    this.graph = graph!
    this.fields = fields!
    effect(() => {
      this.isPending.value = Object.entries(this.fields ?? {}).some(([_key, field]) => field.isPending.value)
    })
  }

  updateModel(model: M) {
    batch(() => {
      Object.entries(this.fields).forEach(([_, field]) => {
        if (!field.properties) { // leaf node
          const value = get(model, field.path)
          if (value !== field.value.value) {
            field.onUpdate({ type: FiledUpdateType.Value, value })
          }
        }
      })
    })
  }

  mergeModel(model: M) {
    batch(() => {
      Object.entries(this.fields).forEach(([_, field]) => {
        if (!field.properties) { // leaf node
          const value = get(model, field.path)
          if (typeof value === "undefined") {
            return;
          }
          if (value !== field.value.value) {
            field.onUpdate({ type: FiledUpdateType.Value, value })
          }
        }
      })
    })
  }

  setErrors(errors: Record<string, FieldErrors>) {
    this.errors = {
      ...this.errors,
      ...errors
    }
  }

  cleanErrors(paths?: string[]) {
    if (paths === undefined) {
      this.errors = {};
      return;
    }
    paths.forEach(p => {
      delete this.errors[p]
    })
  }

  setFieldValue(field: string, value: any) {
    this.fields[field].onUpdate({ type: FiledUpdateType.Value, value });
  }

  setFieldProps(field: string, props: any) {
    this.fields[field].onUpdate({ type: FiledUpdateType.Props, value: props });
  }

  getFieldValue(field: string) {
    return this.model.value[field]
  }

  getFieldError(field: string) {
    return this.errors[field];
  }

  reset() {
    this.submitted.value = false;
    Object.values(this.graph).map((field) => {
      field.reset()
    })
    this.errors = {};
  }

  async submit<T>() {
    if (Object.keys(this.errors).length > 0) {
      return {
        errors: this.errors,
        model: {}
      };
    }
    const model = {} as T
    await Promise.all(Object.values(this.graph).map(async (field) => {
      return set(model, field.path, await field.onSubmit())
    }))
    this.submitted.value = true;
    return {
      model,
      errors: this.errors
    };
  }
}
