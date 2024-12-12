import { AbstractModel, AbstractModelConstructorOptions, Model } from "./abstract_model"
import { Filed } from "../control/fieldControl"
import { signal } from "@preact/signals-core"

interface FormConfig<M extends Model> extends AbstractModelConstructorOptions<M> {
  graph: Record<string, Filed>
}

export function createRXForm(config: FormConfig<Model>) {
  const model = Object.entries(config.graph).reduce((acc, [, value]) => {
    const { id, data2model } = value
    acc[id] = data2model?.() || ''
    return acc
  }, {} as any)
  return new AbstractModel({
    ...config,
    model: signal(model)
  })
}
