import { AbstractModel, AbstractModelConstructorOptions, Model } from "./abstract_model"
import { FieldConfig, FieldControl } from "../control/fieldControl"
import { signal } from "@preact/signals-core"

interface FormConfig<M extends Model> extends AbstractModelConstructorOptions<M> {
  graph: Record<string, FieldConfig>
}

export function createRXForm(config: FormConfig<Model>) {
  const model = Object.entries(config.graph).reduce((acc, [, value]) => {
    const { id } = value
    acc[id] = ''
    return acc
  }, {} as any)
  return new AbstractModel({
    ...config,
    model: signal(model)
  })
}
