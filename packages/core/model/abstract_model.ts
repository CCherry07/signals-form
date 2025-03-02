import { deepSignal, peek, Signal, signal, effect, isString, isArray } from "alien-deepsignals";
import { clonedeep, get, isProd, set, setSignal } from "@signals-form/shared";
import { createModel } from "./utils";

import { type BoolContext, Decision, setup } from "../boolless"
import type { Resolver } from "../types/resolvers";
import type { AbstractModelConstructor, AbstractModelInitOptions, Model, SubscribeProps } from "../types/form";
import { FieldBuilder } from "../builder/field";
import { FieldErrors } from "../types/field";
import { validate } from "../validator";
import { Context, ValidateItem } from "../types/validator";
import { Graph } from "../relation/graph"
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

  // status 
  isInitialized: Signal<boolean> = signal(false)

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
      field.setAppContext(this.appContext)
    })
    this.graph = graph!
    this.normalizeFields()
    this.isInitialized.value = true
    // handle field effectFields
    effect(() => {
      // this.isUpdating.value = Object.values(this.fields ?? {}).some((field) => field.isUpdating) ?? false
    })
  }

  normalizeFields() {
    for (let field of Object.values(this.fields)) {
      field.normalizeField()
    }

    // handle field relations has cycle
    this.warningRelationCycle()
  }

  warningRelationCycle() {
    if (!isProd) {
      const cycles = this.detectCycles(Object.values(this.fields))
      if (cycles.length) {
        console.warn('relation has cycle dependencies:', cycles.map((cycle) => cycle.map(n => n.path).join(' -> ') + '->' + cycle[0].path));
      }
    }
  }

  detectCycles(graph: FieldBuilder[]) {
    const UNVISITED = 0, VISITING = 1, VISITED = 2;
    const nodeStates = new Map<FieldBuilder, number>();
    const currentFields: FieldBuilder[] = [];
    const cycles: FieldBuilder[][] = [];
    for (const node of graph) {
      nodeStates.set(node, UNVISITED);
    }

    function dfs(node: FieldBuilder) {
      const currentState = nodeStates.get(node);
      if (node.isVoidField || currentState === VISITED) {
        return;
      }
      if (currentState === VISITING) {
        const cycleStartIndex = currentFields.indexOf(node);
        if (cycleStartIndex !== -1) {
          cycles.push(currentFields.slice(cycleStartIndex));
        }
        return;
      }

      nodeStates.set(node, VISITING);
      currentFields.push(node);

      for (const neighbor of node.effectFields) {
        dfs(neighbor);
      }

      currentFields.pop();
      nodeStates.set(node, VISITED);
    }

    for (const node of graph) {
      if (nodeStates.get(node) === UNVISITED) {
        dfs(node);
      }
    }

    return cycles;
  }

  buildDependencyGraph() {
    const graph = new Graph();
    Object.values(this.fields).forEach((field) => {
      graph.addVertex(field.path, field)
    })
    Object.values(this.fields).forEach((field) => {
      field.effectFields.forEach((effectField) => {
        graph.addEdge(field.path, effectField.path)
      })
    })
    return graph
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
    // triggered by field update properties so you also need to calculate whether there is a circular dependency
    if (this.isInitialized.value && field.effectFields.size > 0) {
      this.warningRelationCycle()
    }
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

  async validate<T>(context: Pick<Context<T>, 'value' | 'updateOn'>, validateItems: ValidateItem<any>[]) {
    return await validate(
      {
        ...context,
        model: this.model,
        defaultValidatorEngine: this.defaultValidatorEngine,
        execDecision: this.execDecision.bind(this)
      },
      validateItems,
      this.validatorResolvers
    )
  }

  execDecision(decision: Decision) {
    return decision.evaluate(this.boolContext)
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
