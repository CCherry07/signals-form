import { signal } from "@preact/signals-core"
import { isFunction, toValue } from "@rxform/shared"
import { Field } from "../controls/field"
import { AbstractModelMethods, Model } from "./abstract_model"

export async function createModel(graph: Field[], model?: Model) {
  return Object.entries(graph).reduce(async (_parent, [, field]) => {
    const { onDefault, properties } = field
    let filedValue = undefined
    if (isFunction(onDefault)) {
      filedValue = await onDefault()
    } else {
      filedValue = model?.[field.id]
    }
    let parent: Record<string, any> = await _parent
    parent[field.id] = filedValue
    if (properties) {
      const childValue = (await createModel(properties, filedValue))
      Object.assign(filedValue, childValue)
    }
    return parent
  }, Promise.resolve({}))
}

export function createGraph(graph: (typeof Field | Field)[]): Field[] {
  return graph.map(Field => {
    const field = isFunction(Field) ? new Field() : Field
    const { properties } = field
    if (properties) {
      field.properties = createGraph(properties)
    }
    return field
  })
}

export function asyncBindingModel(
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

export async function syncBindingModel(
  abstractModelMethods: AbstractModelMethods,
  graph: Field[],
  fields: Record<string, Field>,
  path: string,
) {
  return Object.entries(graph).reduce(async (_parent, [, field]) => {
    const { id, onDefault, properties } = field
    const filedValue = signal()
    if (isFunction(onDefault)) {
      field.isPending.value = true
      filedValue.value = await onDefault()
      field.isPending.value = false
    } else {
      filedValue.value = toValue(field?.value)
    }
    let parent = await _parent
    parent.value[id!] = filedValue
    field.value = parent.value[id!]
    field.path = path ? `${path}.${id}` : id;
    fields[field.path] = field
    field.abstractModel = abstractModelMethods
    if (properties) {
      const childValue = (await syncBindingModel(abstractModelMethods, properties, fields, field.path!))?.value
      field.value!.value = {
        ...filedValue?.value ?? {},
        ...childValue
      }
    }
    return parent
  }, Promise.resolve(signal({} as any)))
}
