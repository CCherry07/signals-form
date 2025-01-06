import type { FormConfig, AbstractModelMethods } from "./types";

import { AbstractModel } from "./abstract_model"
import { asyncBindingModel, createGraph } from "./utils";

export class FormGroup {
  forms: Map<string, AbstractModel<any>>;
  constructor() {
    this.forms = new Map();
  }

  create(config: FormConfig) {
    const form = new AbstractModel(config.id)
    const methods: AbstractModelMethods = {
      setFieldValue: form.setFieldValue.bind(form),
      setErrors: form.setErrors.bind(form),
      setFieldProps: form.setFieldProps.bind(form),
      cleanErrors: form.cleanErrors.bind(form),
      onSubscribe: form.onSubscribe.bind(form),
      setFieldErrors: form.setFieldErrors.bind(form),
      getFieldValue: form.getFieldValue.bind(form),
      peekFieldValue: form.peekFieldValue.bind(form)
    }
    const graph = createGraph(config.graph)
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
export function createGroupForm() {
  if (formGroup) {
    return formGroup
  }
  formGroup = new FormGroup()
  return formGroup
}
