import { FieldErrors } from "../validator/error/field";
import { BoolsConfig, setup, type BoolValues } from "../boolless"
import { batch, Signal } from "@preact/signals-core";
import { get, set } from "@rxform/shared";
import { Field, FiledUpdateType } from "../controls/field";
export type Model = Record<string, any>;
export interface AbstractModel<M extends Signal<Model>> {
  bools: BoolValues;
  submitted: boolean;
  errors: Record<string, FieldErrors>;
  model: M;
  validatorEngine: string;
  defaultValidatorEngine: string;
  graph: Record<string, Field>
  fields: Record<string, Field>
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
  reset(): void;
  submit(): Promise<Model>;
}

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

  }

  init(options: AbstractModelConstructorOptions<M>) {
    const { validatorEngine, defaultValidatorEngine, boolsConfig, model = {}, graph, fields } = options;
    this.submitted = false;
    this.errors = {};
    this.model = model as M;
    this.validatorEngine = validatorEngine;
    this.defaultValidatorEngine = defaultValidatorEngine
    this.bools = setup(boolsConfig, this.model)
    this.graph = graph!
    this.fields = fields!
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
    this.submitted = false;
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
    await Promise.all(Object.entries(this.fields).map(async ([_, field]) => {
      return set(model, field.path, await field.onSubmit())
    }))
    this.submitted = true;
    return {
      model,
      errors: this.errors
    };
  }
}
