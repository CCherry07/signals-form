import type { FieldBuilder } from "../builder/field";
import type { Field } from "../types/field";

import { Effect, isArray, isFunction, effect } from "alien-deepsignals"

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)

export type RelationEntry = [
  deps: string | string[],
  cb: (this: FieldBuilder, depValues: any) => void
]
export type RelationFn = (field: Field) => void

export type Relation = RelationFn | RelationEntry

export function createRelation(relation: Relation) {
  return function (this: FieldBuilder) {
    let field = this
    if (isFunction(relation)) {
      return effect(() => {
        relation.bind(null, field)
      })
    }
    const [deps, cb] = relation;
    (isArray(deps) ? deps : [deps]).forEach((dep) => {
      this.getAbstractModel().getField(dep).appendEffectField(field)
    })
    const getter = () => this.getAbstractModel().getFieldsValue(deps)
    const e = new Effect(getter)
    let oldValue = getter()
    e.scheduler = function () {
      if (!e.active || !e.dirty || field.getValueStatus().pending) return
      const newValue = e.run()
      if (!hasChanged(newValue, oldValue)) return
      cb?.call(field, newValue)
      oldValue = newValue
    }
    effect(() => {
      if (!field.getValueStatus().pending) {
        e.notify()
      }
    })
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
