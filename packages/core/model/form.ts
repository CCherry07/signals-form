import { AbstractModel, Model, AbstractModelMethods } from "./abstract_model"
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
  }
  const fields = {}
  const graph = createGraph(config.graph!)
  const model = asyncBindingModel(methods, graph!, fields, "")
  form.init({
    ...config,
    graph,
    model,
    fields
  })
  return form
}
