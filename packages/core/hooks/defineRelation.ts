import type { FieldBuilder } from "../builder/field";
import type { Field } from "../types/field";

import { Effect, isArray, isFunction, effect } from "alien-deepsignals"

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)

export type RelationEntry<T extends FieldBuilder> = [
  deps: string | string[],
  cb: (field: Field<T>, depValues: RelationEntry<T>[0] extends string[] ? Array<any> : any) => void
]
export type RelationFn<T extends FieldBuilder> = (field: Field<T>) => void

export type Relation<T extends FieldBuilder> = RelationFn<T> | RelationEntry<T>

export function createRelation<T extends FieldBuilder>(relation: Relation<T>) {
  return function (this: T) {
    const field = this
    if (isFunction(relation)) {
      return effect(() => {
        relation(field)
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
      cb?.(field, newValue)
      oldValue = newValue
    }
    effect(() => {
      if (!field.getValueStatus().pending) {
        e.notify()
        field.getValueStatusMethods().setValueWillPending(false)
      }
    })
    e.run()
    return e
  }
}

export function defineRelation<T extends FieldBuilder>(relation: Relation<T>[] | RelationFn<T>) {
  if (isArray(relation)) {
    return (relation).map(createRelation<T>)
  } else {
    return [createRelation<T>(relation)]
  }
}
