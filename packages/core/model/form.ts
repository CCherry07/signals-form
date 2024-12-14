import { AbstractModel, AbstractModelConstructorOptions, Model } from "./abstract_model"
import { Filed } from "../controls/fieldControl"
import { DecoratorInject } from "../controls/decorator"
import { signal } from "@preact/signals-core"
import { toValue } from "@rxform/shared"

interface FormConfig<M extends Model> extends AbstractModelConstructorOptions<M> {
  graph: Record<string, Filed & DecoratorInject>
}
function refreshModel(graph: Record<string, Filed & DecoratorInject>) {
  return Object.entries(graph).reduce((acc, [, filed]) => {
    const { id, data2model, properties } = filed
    const filedValue = signal(data2model ? data2model?.() || toValue(filed?.value) : toValue(filed?.value))
    filed.value = filedValue
    acc.value[id!] = filedValue
    if (properties) {
      const childValue = refreshModel(properties).value
      filed.value.value = {
        ...filedValue.value,
        ...childValue
      }
    }
    return acc
  }, signal({} as any))
}
export function createRXForm(config: FormConfig<Model>) {
  const model = refreshModel(config.graph)
  return new AbstractModel({
    ...config,
    model
  })
}
