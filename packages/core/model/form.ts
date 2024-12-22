import { AbstractModel, AbstractModelConstructorOptions, Model, AbstractModelMethods } from "./abstract_model"
import { Field } from "../controls/field"
import { signal } from "@preact/signals-core"
// import { isFunction, toValue } from "@rxform/shared"
interface FormConfig<M extends Model> extends AbstractModelConstructorOptions<M> {
  id: string
}
// async function syncBindingModel(
//   abstractModelMethods: AbstractModelMethods,
//   graph: Record<string, Field>,
//   fields: Record<string, Field>,
//   path: string,
// ) {
//   return Object.entries(graph).reduce(async (_parent, [, field]) => {
//     const { id, data2model, properties } = field
//     const filedValue = signal()
//     if (isFunction(data2model)) {
//       field.isPending.value = true
//       filedValue.value = await data2model()
//       field.isPending.value = false
//     } else {
//       filedValue.value = toValue(field?.value)
//     }
//     let parent = await _parent
//     parent.value[id!] = filedValue
//     field.value = parent.value[id!]
//     fields[id!] = field
//     field.path = path ? `${path}.${id}` : id;
//     field.abstractModel = abstractModelMethods
//     if (properties) {
//       const childValue = (await syncBindingModel(abstractModelMethods, properties, fields, field.path!))?.value
//       field.value!.value = {
//         ...filedValue?.value ?? {},
//         ...childValue
//       }
//     }
//     return parent
//   }, Promise.resolve(signal({} as any)))
// }

function asyncBindingModel(
  abstractModelMethods: AbstractModelMethods,
  graph: Field[],
  fields: Record<string, Field>,
  path: string,
) {
  return graph.reduce((parent, field) => {
    const { id, properties } = field
    field.onBeforeInit?.()
    const filedValue = signal()
    parent.value[id] = filedValue
    field.value = parent.value[id!]
    field.path = path ? `${path}.${id}` : id;
    fields[field.path] = field
    field.abstractModel = abstractModelMethods
    if (properties) {
      field.value.value = asyncBindingModel(abstractModelMethods, properties, fields, field.path!)?.value
    }
    field.reset()
    field.onInit?.()
    return parent
  }, signal({} as any))
}
export function createRXForm(config: FormConfig<Model>) {
  const form = new AbstractModel(config.id)
  const methods: AbstractModelMethods = {
    setFieldValue: form.setFieldValue.bind(form),
    setErrors: form.setErrors.bind(form),
    setFieldProps: form.setFieldProps.bind(form),
    cleanErrors: form.cleanErrors.bind(form),
    onSubscribe: form.onSubscribe.bind(form)
  }
  const fields = {}
  const model = asyncBindingModel(methods, config.graph!, fields, "")
  form.init({
    ...config,
    model,
    fields
  })
  return form
}
