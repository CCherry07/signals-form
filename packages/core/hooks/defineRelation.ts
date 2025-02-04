import type { FieldBuilder } from "../builder/field";
import { Effect, isArray, isFunction, effect } from "alien-deepsignals"


export type RelationEntry = [
  deps: string | string[],
  cb: (this: FieldBuilder, depValues: any) => void
]
export type RelationFn = (field: FieldBuilder) => void

export type Relation = RelationFn | RelationEntry

export function createRelation(relation: Relation) {
  return function (this: FieldBuilder) {
    let field = this
    if (isFunction(relation)) {
      return effect(() => {
        relation.bind(null, field)
      })
    }
    const [deps, cb] = relation
    const getter = () => this.getAbstractModel().getFieldValues(deps)
    const e = new Effect(getter)
    e.scheduler = function () {
      if (!e.active || !e.dirty) return
      const newValue = e.run()
      cb?.call(field, newValue)
    }
    e.run()
    return e
  }
}

export function defineRelation(relation: Relation[] | RelationFn) {
  if (isArray(relation)) {
    return (relation as Relation[]).map(createRelation)
  } else {
    return [createRelation(relation)]
  }
}
