import type { FieldBuilder } from "../builder/field";
import { Effect, isArray } from "alien-deepsignals"

export type Relation = {
  deps: string | string[],
  cb: (this: FieldBuilder, depValues: any) => void
}

export function createRelation({ deps, cb }: Relation) {
  return function (this: FieldBuilder) {
    let field = this
    const getter = () => this.abstractModel.getFieldValues(deps)
    const effect = new Effect(getter)
    effect.scheduler = function () {
      if (!effect.active || !effect.dirty) return
      const newValue = effect.run()
      cb.call(field, newValue)
    }
    return effect
  }
}

export function defineRelation(relation: Relation | Relation[]) {
  if (isArray(relation)) {
    return relation.map(createRelation)
  } else {
    return [createRelation(relation)]
  }
}
