import { isFunction } from "@signals-form/shared"
import { FieldBuilder } from "../builder/field"
import type { AbstractModelMethods, Model } from "../types/form"

export async function createModel(graph: FieldBuilder[], model?: Model) {
  return Object.entries(graph).reduce(async (_parent, [, field]) => {
    const properties = field.getProperties()
    const { setDefaultValue } = field.getActions()
    let filedValue = undefined
    if (isFunction(setDefaultValue)) {
      filedValue = await setDefaultValue.call(field)
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

export function createGraph(graph: FieldBuilder[], mothods: AbstractModelMethods, appContext: any): FieldBuilder[] {
  return graph.map(field => {
    field.path = field.id
    field.parentpath = ""
    field.setAbstractModel(mothods)
    field.setAppContext(appContext)
    field.normalizeProperties()
    field.reset()
    field.onInit?.()
    mothods.addField(field)
    return field
  })
}
