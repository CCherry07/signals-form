import { batch, effect, Signal, signal } from "@preact/signals-core";
import { get, set, toDeepValue } from "@rxform/shared";

import { BoolsConfig, setup, type BoolValues } from "../boolless"
import { Field, FieldErrors, FiledUpdateType } from "../controls/field";
import { validatorResolvers } from "../validator";
import type { Resolver } from "../resolvers/type";
import { createModel } from "./utils";

export type Model = Record<string, any>;

export interface AbstractModel<M extends Signal<Model>> {
  bools: BoolValues;
  submitted: Signal<boolean>;
  submiting: Signal<boolean>;
  errors: Record<string, FieldErrors>;
  model: M;
  validatorEngine: string;
  defaultValidatorEngine: string;
  graph: Field[]
  fields: Record<string, Field>
  isPending: Signal<boolean>
  validatorResolvers: Record<string, Resolver>
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
  onSubscribe(fn: (props: SubscribeProps<M>) => void): () => void;
  reset(): void;
  submit(): Promise<Model>;
}
export type AbstractModelMethods = Pick<AbstractModelMathods<Signal<Model>>, 'setFieldValue' | 'setErrors' | 'setFieldProps' | 'cleanErrors' | 'onSubscribe'>

export interface AbstractModelConstructorOptions<M extends Model> {
  validatorEngine: string;
  defaultValidatorEngine: string;
  boolsConfig: BoolsConfig<M>
  model?: M;
  graph?: Field[]
  fields?: Record<string, Field>
}

export class AbstractModel<M> implements AbstractModel<M> {
  id: string;
  models: Map<string, Model>;
  modelId: string;
  constructor(id: string) {
    this.validatorResolvers = validatorResolvers
    this.isPending = signal(true)
    this.submitted = signal(false);
    this.submiting = signal(false);
    this.id = id
    this.modelId = 'default'
    this.models = new Map();

  }

  init(options: AbstractModelConstructorOptions<M>) {
    const { validatorEngine, defaultValidatorEngine, boolsConfig, model = {}, graph, fields } = options;
    this.errors = {};
    this.model = model as M;
    this.validatorEngine = validatorEngine;
    this.defaultValidatorEngine = defaultValidatorEngine
    this.bools = Object.freeze(setup(boolsConfig, this.model))
    Object.values(fields!)!.forEach((field) => {
      field.bools = this.bools
    })
    this.graph = graph!
    this.fields = fields!
    effect(() => {
      this.isPending.value = Object.values(this.fields ?? {}).some((field) => field.isPending.value) ?? false
    })
  }

  async createModel(modelId: string) {
    if (this.models.has(modelId)) {
      throw new Error("model is already defined")
    }
    const model = await createModel(this.graph)
    return model
  }

  useOrCreateModel(modelId: string) {
    const model = this.models.get(modelId);
    if (model) {
      this.resetModel(model);
    } else {
      this.models.set(modelId, toDeepValue(this.model));
      this.resetModel();
      this.modelId = modelId;
    }
  }

  getModel() {
    return this.models;
  }

  getFormId() {
    return this.id;
  }

  getModels() {
    return this.models;
  }

  useModel(modelId: string) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error("model is not defined")
    }
    this.updateModel(model);
    return model;
  }

  removeModel(modelId: string) {
    this.models.delete(modelId);
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

  updateModel(model: Model) {
    batch(() => {
      Object.values(this.fields).forEach((field) => {
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
      Object.values(this.fields).forEach((field) => {
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
    this.graph.forEach((field) => {
      field.reset()
    })
    this.errors = {};
  }

  resetModel(model?: Model) {
    this.graph.map((field) => {
      field.resetModel(model ? model[field.id] : undefined)
    })
  }

  async submit<T>() {
    batch(() => {
      this.submitted.value = false;
      this.submiting.value = true;
    })
    if (Object.keys(this.errors).length > 0) {
      this.submiting.value = false;
      return {
        errors: this.errors,
        model: {}
      };
    }
    const model = {} as T
    await Promise.all(Object.values(this.graph).map(async (field) => {
      return set(model, field.path, await field._onSubmit())
    }))
    batch(() => {
      this.submitted.value = true;
      this.submiting.value = false;
    })
    return {
      model,
      errors: this.errors
    };
  }
}
