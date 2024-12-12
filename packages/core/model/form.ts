import { AbstractModel, AbstractModelConstructorOptions, Model } from "./abstract_model"
import { Filed } from "../controls/fieldControl"
import { signal } from "@preact/signals-core"

interface FormConfig<M extends Model> extends AbstractModelConstructorOptions<M> {
  graph: Record<string, Filed>
}
export function createRXForm(config: FormConfig<Model>) {
  const model = Object.entries(config.graph).reduce((acc, [, filed]) => {
    const { id, data2model } = filed
    acc[id] = data2model ? data2model?.() || filed.value : filed.value
    return acc
  }, {} as any)
  return new AbstractModel({
    ...config,
    model: signal(model)
  })
}
