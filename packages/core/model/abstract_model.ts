import { FieldErrors } from "../validate/error/field";
import { BoolsConfig, setup, type BoolValues } from "../boolless"
import { effect, signal, Signal } from "@preact/signals-core";
export type Model = Record<string, any>;
export interface AbstractModel<M extends Signal<Model>> {
  bools: BoolValues;
  submitted: boolean;
  errors: FieldErrors;
  model: M;
  validatorEngine: string;
  defaultValidatorEngine: string;
}
// onSubmit: (model: Model) => void;
// onReset: () => void;
// updateModel: (model: Model) => void;
// setErrors: (errors: FieldErrors) => void;
// setFieldValue: (field: string, value: any) => void;
// getFieldValue: (field: string) => any;
// getFieldError: (field: string) => string | undefined;
// validate: () => Promise<boolean>;
// validateField: (field: string) => Promise<boolean>;
// validateFields: (fields: string[]) => Promise<boolean>;
// validateFieldsAndScroll: (fields: string[]) => Promise<boolean>;
// validateFieldsAndScrollToFirstError: (fields: string[]) => Promise<boolean>;

export interface AbstractModelConstructorOptions<M extends Model> {
  validatorEngine: string;
  defaultValidatorEngine: string;
  boolsConfig: BoolsConfig<M>
  model: M
}

export class AbstractModel<M> implements AbstractModel<M> {
  constructor(options: AbstractModelConstructorOptions<M>) {
    const { validatorEngine, defaultValidatorEngine, boolsConfig } = options;
    this.submitted = false;
    this.errors = {};
    this.model = signal({}) as M;
    this.validatorEngine = validatorEngine;
    this.defaultValidatorEngine = defaultValidatorEngine
    effect(() => {
      this.bools = setup(boolsConfig, this.model)
      console.log(this.bools);
    })
  }

  updateModel(model: M) {
    this.model = model;
  }

  setErrors(errors: FieldErrors) {
    this.errors = errors;
  }

  setFieldValue(field: string, value: any) {
    this.model.value[field] = value;
  }

  getFieldValue(field: string) {
    return this.model.value[field]
  }

  getFieldError(field: string) {
    return this.errors[field];
  }

  validate() {
    return Promise.resolve(true);
  }

  validateField(field: string) {
    return Promise.resolve(true);
  }

  validateFields(fields: string[]) {
    return Promise.resolve(true);
  }

  validateFieldsAndScroll(fields: string[]) {
    return Promise.resolve(true);
  }

  validateFieldsAndScrollToFirstError(fields: string[]) {
    return Promise.resolve(true);
  }

  reset() {
    this.submitted = false;
    this.errors = {};
  }

  submit() {
    this.submitted = true;
  }
}
