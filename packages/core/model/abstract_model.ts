import { FieldErrors } from "../validate/error/field";
import { BoolsConfig, setup, type BoolValues } from "../boolless"
import { Signal } from "@preact/signals-core";
import { toDeepValue } from "@rxform/shared";
import { Filed, FiledUpdateType } from "../controls/fieldControl";
import { DecoratorInject } from "../controls/decorator";
export type Model = Record<string, any>;
export interface AbstractModel<M extends Signal<Model>> {
  bools: BoolValues;
  submitted: boolean;
  errors: FieldErrors;
  model: M;
  validatorEngine: string;
  defaultValidatorEngine: string;
  graph: Record<string, Filed & DecoratorInject>
  fields: Record<string, Filed & DecoratorInject>
}

export interface AbstractModelMathods<M extends Signal<Model>> {
  updateModel(model: M): void;
  setErrors(errors: FieldErrors): void;
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
  graph?: Record<string, Filed & DecoratorInject>
  fields?: Record<string, Filed & DecoratorInject>
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
    this.model.value = model;
  }

  setErrors(errors: FieldErrors) {
    this.errors = errors;
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
