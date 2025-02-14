import { AbstractModel } from "./abstract_model"
import type { AbstractModelMethods, FormConfig } from "../types/form";

import { createGraph } from "./utils";

export function createRXForm(config: FormConfig) {
  const form = new AbstractModel(config.id)
  const methods: AbstractModelMethods = {
    setFieldValue: form.setFieldValue.bind(form),
    setErrors: form.setErrors.bind(form),
    cleanErrors: form.cleanErrors.bind(form),
    onSubscribe: form.onSubscribe.bind(form),
    setFieldErrors: form.setFieldErrors.bind(form),
    getFieldValue: form.getFieldValue.bind(form),
    peekFieldValue: form.peekFieldValue.bind(form),
    getField: form.getField.bind(form),
    addField: form.addField.bind(form),
    getFieldsValue: form.getFieldsValue.bind(form),
    getFieldValueStatus: form.getFieldValueStatus.bind(form),
    validate: form.validate.bind(form),
    execDecision: form.execDecision.bind(form),
  }
  const graph = createGraph(config.graph!, methods, form.appContext)
  form.init({
    ...config,
    graph,
  })
  return form
}
