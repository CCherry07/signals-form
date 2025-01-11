import { isProd, isArray, isObject, isString, get, isFunction } from "@rxform/shared"

import { type BoolValues, Decision } from "../boolless"
import type { FactoryOptions, Resolver } from "../resolvers/type"
import type { FieldErrors } from "../controls/field"
import type { AbstractModel } from "../model/abstract_model"

export interface ValidateItem {
  schema: any
  engine?: string
  fact?: string | object
  updateOn?: string | string[]
  needValidate?: Decision
  factoryOptions?: FactoryOptions
  schemaOptions?: any
}


export function setup(this: AbstractModel<any>, validator: string, resolver: Resolver) {
  if (!isProd && this.validatorResolvers[validator]) {
    console.warn(`${validator} is already registered`);
  }
  this.validatorResolvers[validator] = resolver
}

/**
 * 
 * @param fact '$.a' | { a: '$.a' , b: "$.b" } $: model
 * @param model Record<string,any>
 * @returns 
 */
const getFactValue = (fact: string | Object | Array<string>, state: any, model: any): any => {
  if (isFunction(fact)) {
    return fact(state, model)
  }
  if (isObject(fact)) {
    return Object.fromEntries(Object.entries(fact).map(([key, value]) => [key, getFactValue(value, state, model)]))
  }
  if (isArray(fact)) {
    return fact.map(item => getFactValue(item, state, model))
  }
  if (isString(fact)) {
    if (fact.startsWith('$')) {
      return get({ $: model, $state: state }, fact)
    }
  }
  return fact
}


interface Context<T> {
  state: T
  updateOn: string
  defaultValidatorEngine: string
  model: Record<string, any>
  boolValues: BoolValues
}

type ValidatorResolvers = Record<string, Resolver>

export const validate = async <T>({ state, updateOn: _updateOn, model, boolValues, defaultValidatorEngine }: Context<T>, validates: ValidateItem[], validatorResolvers: ValidatorResolvers): Promise<FieldErrors> => {
  const fieldErrors = {} as FieldErrors
  for (const item of validates) {
    const { schema, engine = defaultValidatorEngine, fact, updateOn, schemaOptions, factoryOptions, needValidate } = item
    if (needValidate instanceof Decision && needValidate.not().evaluate(boolValues)) continue
    if (typeof updateOn === "string" && updateOn !== _updateOn || isArray(updateOn) && updateOn.includes(_updateOn)) continue
    if (!isFunction(validatorResolvers[engine])) {
      throw new Error(`validator ${engine} is not registered`)
    }
    const validator = validatorResolvers[engine](schema, schemaOptions, factoryOptions)
    const factValue = fact ? getFactValue(fact, state, model) : state

    const { errors } = await validator(factValue)
    Object.assign(fieldErrors, errors)
  }
  return fieldErrors
}
