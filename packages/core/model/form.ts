import { AbstractModel, AbstractModelMathods, AbstractModelConstructorOptions, Model } from "./abstract_model"
import { Filed } from "../controls/fieldControl"
import { DecoratorInject } from "../controls/decorator"
import { Signal, signal } from "@preact/signals-core"
import { toValue } from "@rxform/shared"

interface FormConfig<M extends Model> extends AbstractModelConstructorOptions<M> {
}
function refreshModel(
  abstractModelMethods: Pick<AbstractModelMathods<Signal<Model>>, 'setFieldValue' | 'setErrors' | 'validateField' | 'setFieldProps' | 'cleanErrors'>,
  graph: Record<string, Filed & DecoratorInject>,
  fields: Record<string, Filed & DecoratorInject>,
  path: string,
) {
  return Object.entries(graph).reduce((parent, [, filed]) => {
    const { id, data2model, properties } = filed
    const filedValue = signal(data2model ? data2model?.() || toValue(filed?.value) : toValue(filed?.value))
    parent.value[id!] = filedValue
    filed.value = parent.value[id!]
    fields[id!] = filed
    filed.path = path ? `${path}.${id}` : id;
    filed.abstractModel = abstractModelMethods
    if (properties) {
      const childValue = refreshModel(abstractModelMethods, properties, fields, filed.path!).value
      filed.value!.value = {
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
    validateField: form.validateField.bind(form),
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
