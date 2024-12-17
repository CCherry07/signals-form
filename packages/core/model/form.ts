import { AbstractModel, AbstractModelMathods, AbstractModelConstructorOptions, Model } from "./abstract_model"
import { Field } from "../controls/field"
import { Signal, signal } from "@preact/signals-core"
import { toValue } from "@rxform/shared"

interface FormConfig<M extends Model> extends AbstractModelConstructorOptions<M> {
}
function refreshModel(
  abstractModelMethods: Pick<AbstractModelMathods<Signal<Model>>, 'setFieldValue' | 'setErrors' | 'setFieldProps' | 'cleanErrors'>,
  graph: Record<string, Field>,
  fields: Record<string, Field>,
  path: string,
) {
  return Object.entries(graph).reduce((parent, [, field]) => {
    const { id, data2model, properties } = field
    const filedValue = signal(data2model ? data2model?.() || toValue(field?.value) : toValue(field?.value))
    parent.value[id!] = filedValue
    field.value = parent.value[id!]
    fields[id!] = field
    field.path = path ? `${path}.${id}` : id;
    field.abstractModel = abstractModelMethods
    if (properties) {
      const childValue = refreshModel(abstractModelMethods, properties, fields, field.path!).value
      field.value!.value = {
        ...filedValue.value,
        ...childValue
      }
    }
    return parent
  }, signal({} as any))
}
export function createRXForm(config: FormConfig<Model>) {
  const form = new AbstractModel()
  const methods = {
    setFieldValue: form.setFieldValue.bind(form),
    setErrors: form.setErrors.bind(form),
    setFieldProps: form.setFieldProps.bind(form),
    cleanErrors: form.cleanErrors.bind(form)
  }
  const fields = {}
  const model = refreshModel(methods, config.graph!, fields, "")
  form.init({
    ...config,
    model,
    fields
  })
  return form
}
