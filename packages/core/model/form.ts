import { type Model, type AbstractModelMethods, AbstractModel } from "./abstract_model"
import { Field } from "../controls/field"
import { BoolsConfig } from "../boolless";
import { asyncBindingModel, createGraph } from "./utils";
export interface FormConfig<M extends Model> {
  id: string
  defaultValidatorEngine: string;
  boolsConfig: BoolsConfig<M>
  model?: M;
  graph?: typeof Field[]
  fields?: Record<string, Field>
}

export function createRXForm(config: FormConfig<Model>) {
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
  const graph = createGraph(config.graph!)
  const { fields } = asyncBindingModel(methods, form.model, graph!)

  form.init({
    ...config,
    graph,
    fields
  })
  return form
}
