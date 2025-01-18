import { AbstractModel } from "./abstract_model"
import type { AbstractModelMethods, FormConfig } from "./types";

import { asyncBindingModel, createGraph } from "./utils";

export function createRXForm(config: FormConfig) {
  const form = new AbstractModel(config.id)
  const methods: AbstractModelMethods = {
    setFieldValue: form.setFieldValue.bind(form),
    setErrors: form.setErrors.bind(form),
    // setFieldProps: form.setFieldProps.bind(form),
    cleanErrors: form.cleanErrors.bind(form),
    onSubscribe: form.onSubscribe.bind(form),
    setFieldErrors: form.setFieldErrors.bind(form),
    getFieldValue: form.getFieldValue.bind(form),
    peekFieldValue: form.peekFieldValue.bind(form),
    getField: form.getField.bind(form)
  }
  const graph = createGraph(config.graph!, form.appContext)
  const { fields } = asyncBindingModel(methods, form.model, config.graph!)

  form.init({
    ...config,
    graph,
    fields
  })
  return form
}
