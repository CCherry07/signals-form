import { signal, toValue } from "alien-deepsignals"
import { isFunction } from "@rxform/shared"
import type { AbstractModelMethods, Model } from "./types"
import { FieldBuilder } from "../builder/field"

export async function createModel(graph: FieldBuilder[], model?: Model) {
  return Object.entries(graph).reduce(async (_parent, [, field]) => {
    const { _actions: { setDefaultValue }, properties } = field
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

export function createGraph(graph: (typeof FieldBuilder | FieldBuilder)[], appContext: any): FieldBuilder[] {
  return graph.map(Field => {
    const f = isFunction(Field) ? new Field() : Field
    if (f.properties) {
      f.properties = createGraph(f.properties, appContext).map((field) => {
        field.parent = f
        field.appContext = appContext
        return field
      })
    }
    return f
  })
  // return graph.map(Field => isFunction(Field)? new Field() : Field)
}

export function asyncBindingModel(
  abstractModelMethods: AbstractModelMethods,
  model: Model,
  graph: FieldBuilder[],
) {
  const fields = {} as Record<string, FieldBuilder>
  function binding(abstractModelMethods: AbstractModelMethods, graph: FieldBuilder[], fields: Record<string, FieldBuilder>, path: string,) {
    graph.forEach((field) => {
      const { id, properties } = field
      field.onBeforeInit?.()
      field.parentpath = path
      field.path = path ? `${path}.${id}` : id;
      field.signalPath = path ? `${path}.$${id}` : id;
      fields[field.path] = field
      field.abstractModel = abstractModelMethods
      if (properties) {
        binding(abstractModelMethods, properties, fields, field.path!)
      }
      field.reset()
      field.onInit?.()
    }, {} as Record<string, any>)
  }
  binding(abstractModelMethods, graph, fields, "")
  return { model, fields }
}

export async function syncBindingModel(
  abstractModelMethods: AbstractModelMethods,
  graph: FieldBuilder[],
  fields: Record<string, FieldBuilder>,
  path: string,
) {
  return Object.entries(graph).reduce(async (_parent, [, field]) => {
    const { id, _actions: { setDefaultValue }, properties } = field
    const filedValue = signal()
    if (isFunction(setDefaultValue)) {
      filedValue.value = await setDefaultValue()
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
