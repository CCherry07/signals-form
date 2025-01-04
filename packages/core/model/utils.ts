import { signal } from "alien-deepsignals"
import { isFunction, toValue } from "@rxform/shared"
import { Field } from "../controls/field"
import { AbstractModelMethods, Model } from "./abstract_model"

export async function createModel(graph: Field[], model?: Model) {
  return Object.entries(graph).reduce(async (_parent, [, field]) => {
    const { setDefaultValue, properties } = field
    let filedValue = undefined
    if (isFunction(setDefaultValue)) {
      filedValue = await setDefaultValue()
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
  model: Model,
  graph: Field[],
) {
  const fields = {} as Record<string, Field>
  function binding(abstractModelMethods: AbstractModelMethods, graph: Field[], fields: Record<string, Field>, path: string,) {
    graph.forEach((field) => {
      const { id, properties } = field
      field.onBeforeInit?.()
      field.path = path ? `${path}.${id}` : id;
      field.signalPath = path ? `${path}.$${id}` : id;
      fields[field.path] = field
      field.abstractModel = abstractModelMethods
      if (properties) {
        binding(abstractModelMethods, properties, fields, field.path!)
      }
      field.reset()
      field.onInit?.()
      return parent
    }, {} as Record<string, any>)
  }
  binding(abstractModelMethods, graph, fields, "")
  return { model, fields }
}

export async function syncBindingModel(
  abstractModelMethods: AbstractModelMethods,
  graph: Field[],
  fields: Record<string, Field>,
  path: string,
) {
  return Object.entries(graph).reduce(async (_parent, [, field]) => {
    const { id, setDefaultValue, properties } = field
    const filedValue = signal()
    if (isFunction(setDefaultValue)) {
      field.isPending.value = true
      filedValue.value = await setDefaultValue()
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
