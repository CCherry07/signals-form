import { isProd, isArray, isObject, isString, get, isFunction } from "@rxform/shared"
import { zodResolver } from "./resolvers/zod"
import { BoolValues, Decision } from "../boolless"

import type { Resolver, FactoryOptions } from "./resolvers/type"
import type { FieldErrors, FieldError } from "./error/field"

export {
  FieldErrors,
  FieldError
}
export interface ValidateItem {
  schema: any
  engine?: string
  fact?: string | object
  updateOn?: string
  needValidate?: Decision
  factoryOptions?: FactoryOptions
  schemaOptions?: any
}

const validatorResolvers: Record<string, Resolver> = {
  zod: zodResolver
}

export const setup = (validator: string, resolver: Resolver) => {
  if (!isProd && validatorResolvers[validator]) {
    console.warn(`${validator} is already registered`);
  }
  validatorResolvers[validator] = resolver
}

interface State<T> {
  state: T
  updateOn: string
}

/**
 * 
 * @param fact '$.a' | { a: '$.a' , b: "$.b" } $: context
 * @param context Record<string,any>
 * @returns 
 */
const getFactValue = (fact: string | Object | Array<string>, state: any, context: any): any => {
  if (isFunction(fact)) {
    return fact(state, context)
  }
  if (isObject(fact)) {
    return Object.fromEntries(Object.entries(fact).map(([key, value]) => [key, getFactValue(value, state, context)]))
  }
  if (isArray(fact)) {
    return fact.map(item => getFactValue(item, state, context))
  }
  if (isString(fact)) {
    if (fact.startsWith('$')) {
      return get({ $: context, $state: state }, fact)
    }
  }
  return fact
}

export const validate = async <T>({ state, updateOn: _updateOn }: State<T>, validates: ValidateItem[], boolsConfig: BoolValues, context: any): Promise<FieldErrors> => {
  const fieldErrors = {} as FieldErrors
  for (const item of validates) {
    const { schema, engine = 'zod', fact, updateOn, schemaOptions, factoryOptions, needValidate } = item
    if (needValidate instanceof Decision && needValidate.not().evaluate(boolsConfig)) continue
    if (typeof updateOn === "string" && updateOn !== _updateOn) continue
    if (!isFunction(validatorResolvers[engine])) {
      throw new Error(`validator ${engine} is not registered`)
    }
    
    const validator = validatorResolvers[engine](schema, schemaOptions, factoryOptions)
    const factValue = fact ? getFactValue(fact, state, context) : state

    const { errors } = await validator(factValue)
    Object.assign(fieldErrors, errors)
  }
  return fieldErrors
}
