import { FieldErrors } from "../validate/error/field";
import { BoolsConfig, setup, type BoolValues } from "../boolless"
import { effect, Signal } from "@preact/signals-core";
import { toDeepValue } from "@rxform/shared";
export type Model = Record<string, any>;
export interface AbstractModel<M extends Signal<Model>> {
  bools: BoolValues;
  submitted: boolean;
  errors: FieldErrors;
  model: M;
  validatorEngine: string;
  defaultValidatorEngine: string;
}

export interface AbstractModelConstructorOptions<M extends Model> {
  validatorEngine: string;
  defaultValidatorEngine: string;
  boolsConfig: BoolsConfig<M>
  model?: M
}

export class AbstractModel<M> implements AbstractModel<M> {
  constructor(options: AbstractModelConstructorOptions<M>) {
    const { validatorEngine, defaultValidatorEngine, boolsConfig, model = {} } = options;
    this.submitted = false;
    this.errors = {};
    this.model = model as M;
    this.validatorEngine = validatorEngine;
    this.defaultValidatorEngine = defaultValidatorEngine
    this.bools = setup(boolsConfig, this.model)
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
    return Promise.resolve(toDeepValue(this.model));
  }
}
