import { deepSignal, peek, Signal, signal, effect } from "alien-deepsignals";
import { clonedeep, get, set } from "@rxform/shared";
import { createModel } from "./utils";

import { type BoolValues, setup } from "../boolless"
import { Field, type FieldErrors } from "../controls/field";
import type { Resolver } from "../resolvers/type";
import type { AbstractModelConstructor, AbstractModelInitOptions, Model, SubscribeProps } from "./types";

export class AbstractModel<M extends Model> {
  id: string;
  models: Map<string, Model>;
  modelId: string;
  defaultValidatorEngine!: string;
  graph!: Field[];
  fields!: Record<string, Field>;
  bools!: BoolValues;
  submitted: Signal<boolean>;
  submiting: Signal<boolean>;
  isUpdating: Signal<boolean>;
  errors!: Record<string, FieldErrors>;
  validatorResolvers: Record<string, Resolver>;
  appContext!: Record<string, any>;
  model!: M;
  constructor(id: string, options?: AbstractModelConstructor) {
    this.validatorResolvers = {}
    this.isUpdating = signal(false)
    this.submitted = signal(false);
    this.submiting = signal(false);
    this.id = id
    this.modelId = 'default'
    this.models = new Map();
    this.model = deepSignal({}) as M
    this.appContext = {
      model: this.model,
      provides: options?.provides
    }
  }

  init(options: AbstractModelInitOptions<M>) {
    const { defaultValidatorEngine, boolsConfig, graph, fields } = options;
    this.errors = {};
    this.modelId = 'default'
    this.defaultValidatorEngine = defaultValidatorEngine
    // @ts-ignore
    this.bools = Object.freeze(setup(boolsConfig, this.model))

    Object.values(fields!)!.forEach((field) => {
      field.bools = this.bools
      field.appContext = this.appContext
    })
    this.graph = graph!
    this.fields = fields!
    this.normalizeEffectFields()
    // handle field effectFields
    effect(() => {
      this.isUpdating.value = Object.values(this.fields ?? {}).some((field) => field.isUpdating) ?? false
    })
  }

  normalizeEffectFields() {
    for (let field of Object.values(this.fields)) {
      field.normalizeDeps()
    }
  }

  async createModel() {
    return await createModel(this.graph)
  }

  saveModel() {
    this.models.set(this.modelId, clonedeep(this.model));
  }

  useOrCreateModel(modelId: string) {
    if (modelId === this.modelId) {
      if (process.env.NODE_ENV !== 'production') {
        throw new Error(`model ${modelId} in use, please use a new model id`)
      }
      return
    }
    this.saveModel();
    const model = this.models.get(modelId);
    this.modelId = modelId;
    if (model) {
      this.updateModel(model);
    } else {
      this.resetModel();
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
    if (modelId === this.modelId) {
      if (process.env.NODE_ENV !== 'production') {
        throw new Error(`model ${modelId} in use, please use a new model id`)
      }
      return
    }
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`model ${modelId} is not defined`)
    }
    this.saveModel();
    this.updateModel(model);
    this.modelId = modelId;
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
        isUpdating: this.isUpdating
      })
      return cleanup;
    })
  };

  updateModel(model: Model) {
    Object.assign(this.model, model)
  }

  mergeModel(model: M) {
    Object.values(this.fields).forEach((field) => {
      if (field.isLeaf) { // leaf node
        const value = get(model, field.path)
        if (typeof value === "undefined") {
          return;
        }
        if (value !== field.value) {
          field.value = value
        }
      }
    })
  }

  setFieldErrors(field: string, errors: FieldErrors) {
    this.errors[field] = errors;
    this.fields[field].setErrors(errors);
  }

  setErrors(errors: Record<string, FieldErrors>) {
    Object.entries(errors).forEach(([path, error]) => {
      this.fields[path].setFieldErrors(error)
    })
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
    set(this.model, field, value)
  }

  // setFieldProps(field: string, props: any) {
  //   this.fields[field].setProps(props)
  // }

  getFieldValue(field: string) {
    return get(this.model, field)
  }

  peekFieldValue(parentpath: string, id: string) {
    return peek(get(this.model, parentpath), id as any)
  }

  getFieldError(field: string) {
    return this.errors[field];
  }

  getField(field: string) {
    return this.fields[field];
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

  onValidate() {

  }

  async submit<T>() {
    this.submitted.value = false;
    this.submiting.value = true;
    if (Object.keys(this.errors).length > 0) {
      this.submiting.value = false;
      return {
        errors: this.errors,
        model: {}
      };
    }
    const model = {} as T
    await Promise.all(Object.values(this.graph).map(async (field) => {
      // @ts-ignore
      return set(model, field.path, await field._onSubmitValue())
    }))
    this.submitted.value = true;
    this.submiting.value = false;
    return {
      model,
      errors: this.errors
    };
  }

  // static forRoot(options: Record<string, any>) {
  //   console.log(this.prototype);
  // }

  provides(data: Record<string, any>) {
    this.appContext = {
      ...this.appContext,
      provides: data
    }
    return this;
  }
}
