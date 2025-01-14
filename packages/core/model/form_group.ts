import type { FormConfig, AbstractModelMethods } from "./types";

import { AbstractModel } from "./abstract_model"
import { asyncBindingModel, createGraph } from "./utils";

export class FormGroup {
  forms: Map<string, AbstractModel<any>>;
  provides: Record<string, any> = {};
  constructor(options: { provides?: Record<string, any> } = {}) {
    this.forms = new Map();
    this.provides = options.provides ?? {};
  }

  create(config: FormConfig) {
    const form = new AbstractModel(config.id).provides(this.provides)
    const methods: AbstractModelMethods = {
      setFieldValue: form.setFieldValue.bind(form),
      setErrors: form.setErrors.bind(form),
      cleanErrors: form.cleanErrors.bind(form),
      onSubscribe: form.onSubscribe.bind(form),
      setFieldErrors: form.setFieldErrors.bind(form),
      getFieldValue: form.getFieldValue.bind(form),
      peekFieldValue: form.peekFieldValue.bind(form),
      getField: form.getField.bind(form)
    }
    const graph = createGraph(config.graph, form.appContext)
    const { fields } = asyncBindingModel(methods, form.model, graph)
    form.init({
      ...config,
      graph,
      fields
    })
    return form;
  }

  add(id: string, form: AbstractModel<any>) {
    this.forms.set(id, form);
    return this;
  }

  remove(id: string) {
    this.forms.delete(id);
    return this;
  }

  get(id: string) {
    return this.forms.get(id);
  }
}

let formGroup: FormGroup | undefined;
export function createGroupForm(options: { provides?: Record<string, any> } = {}) {
  if (formGroup) {
    return formGroup
  }
  formGroup = new FormGroup({
    provides: options.provides
  })
  return formGroup
}
