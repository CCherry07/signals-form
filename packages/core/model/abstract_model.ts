import { deepSignal, peek, Signal, signal, effect, isString, isArray } from "alien-deepsignals";
import { clonedeep, get, set, setSignal } from "@formula/shared";
import { createModel } from "./utils";

import { type BoolContext, setup } from "../boolless"
import type { Resolver } from "../resolvers/type";
import type { AbstractModelConstructor, AbstractModelInitOptions, Model, SubscribeProps } from "../types/form";
import { FieldBuilder } from "../builder/field";
import { FieldErrors } from "../types/field";
import { validate } from "../validator";
import { ValidateItem } from "../validator/types";

export class AbstractModel<M extends Model> {
  id: string;
  models: Map<string, Model>;
  modelId: string;
  defaultValidatorEngine!: string;
  graph!: FieldBuilder[];
  fields: Record<string, FieldBuilder> = {};
  boolContext!: BoolContext;
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
    const { defaultValidatorEngine, boolsConfig = {}, graph } = options;
    this.errors = {};
    this.modelId = 'default'
    this.defaultValidatorEngine = defaultValidatorEngine
    // @ts-ignore
    this.boolContext = setup(boolsConfig, this.model)
    Object.values(this.fields!)!.forEach((field) => {
      field.setBoolContext(this.boolContext)
      field.setAppContext(this.appContext)
    })
    this.graph = graph!
    this.normalizeFields()
    // handle field effectFields
    effect(() => {
      // this.isUpdating.value = Object.values(this.fields ?? {}).some((field) => field.isUpdating) ?? false
    })
  }

  normalizeFields() {
    for (let field of Object.values(this.fields)) {
      field.normalizeField()
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
        boolContext: this.boolContext,
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
    Object.assign(this.model, model) // lodash merage
  }

  setFieldErrors(field: string, errors: FieldErrors) {
    this.errors[field] = errors;
    this.fields[field].errors.value = errors;
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
    setSignal(this.model, field, value)
  }

  // setFieldProps(field: string, props: any) {
  //   this.fields[field].setProps(props)
  // }

  getFieldValue(field: string) {
    return get(this.model, field)
  }

  getFieldsValue<T>(fields: string | string[]): T {
    if (isString(fields)) {
      return this.getFieldValue(fields)
    } else if (isArray(fields)) {
      return fields.map((key) => this.getFieldValue(key)) as T
    } else {
      throw new Error("not found")
    }
  }

  peekFieldValue(parentpath: string, id: string) {
    return peek(parentpath ? get(this.model, parentpath) : this.model, id as any)
  }

  getFieldError(field: string) {
    return this.errors[field];
  }

  getField(field: string) {
    return this.fields[field];
  }

  addField(field: FieldBuilder) {
    this.fields[field.path] = field
  }

  getFieldValueStatus(field: string) {
    return this.fields[field].getValueStatus()
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

  async validate(fieldpath: string, type?: "passive" | "initiative") {
    const filed = this.getField(fieldpath)
    const validator = filed.getValidator()
    if (!validator) return
    const { initiative, passive } = validator
    const fieldErrors = {} as {
      initiative?: FieldErrors
      passive?: FieldErrors
    }
    const context = {
      state: filed.value,
      defaultValidatorEngine: this.defaultValidatorEngine,
      boolContext: this.boolContext,
      model: this.model
    }

    if (!type) {
      fieldErrors.initiative = await validate(
        context,
        initiative as ValidateItem[],
        this.validatorResolvers
      )
      fieldErrors.passive = await validate(
        context,
        passive as ValidateItem[],
        this.validatorResolvers
      )
    }

    if (type === "initiative" && initiative) {
      fieldErrors.initiative = await validate(
        context,
        initiative as ValidateItem[],
        this.validatorResolvers
      )
    }
    if (type === "passive" && passive) {
      fieldErrors.passive = await validate(
        context,
        passive as ValidateItem[],
        this.validatorResolvers
      )
    }

    this.setFieldErrors(fieldpath, {
      ...fieldErrors.initiative,
      ...fieldErrors.passive
    })

    return fieldErrors
  }

  async submit<T>() {
    this.submitted.value = false;
    this.submiting.value = true;

    //TODO revalidate ?
    if (Object.keys(this.errors).length > 0) {
      this.submiting.value = false;
      return {
        errors: this.errors,
        model: {}
      };
    }
    const model = {} as T
    await Promise.all(Object.values(this.graph).map(async (field) => {
      if (field.isVoidField) {
        Object.assign(model as Record<string, any>, await field.onSubmit())
        return
      }
      return set(model, field.path, await field.onSubmit())
    }))
    this.submitted.value = true;
    this.submiting.value = false;
    return {
      model,
      errors: this.errors
    };
  }

  provides(data: Record<string, any>) {
    this.appContext = {
      ...this.appContext,
      provides: data
    }
    return this;
  }
}
