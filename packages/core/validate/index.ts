import { isProd, isArray, isObject, isString, get } from "@rxform/shared"
import { zodResolver } from "./resolvers/zod"
import { BoolValues, Decision } from "../boolless"

import type { Resolver, FactoryOptions } from "./resolvers/type"
import type { FieldErrors } from "./error/field"

export interface ValidateItem {
  schema: any
  engine?: string
  fact?: string | object
  on?: string
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
  value: T
  event: string
}

/**
 * 
 * @param fact '$.a' | { a: '$.a' , b: "$.b" } $: context
 * @param context Record<string,any>
 * @returns 
 */
const getFactValue = (fact: string | Object | Array<string>, context: any): any => {
  if (isObject(fact)) {
    return Object.fromEntries(Object.entries(fact).map(([key, value]) => [key, getFactValue(value, context)]))
  }
  if (isArray(fact)) {
    return fact.map(item => getFactValue(item, context))
  }
  if (isString(fact)) {
    if (fact.startsWith('$')) {
      return get({ $: context }, fact)
    }
  }
  return fact
}

export const validate = async <T>(value: State<T>, validates: ValidateItem[], boolsConfig: BoolValues, context: any): Promise<FieldErrors> => {
  const fieldErrors = {} as FieldErrors
  for (const item of validates) {
    const { schema, engine = 'zod', fact, on, schemaOptions, factoryOptions, needValidate } = item
    if (needValidate instanceof Decision && needValidate.not().evaluate(boolsConfig)) continue
    if (typeof on === "string" && on !== value.event) continue
    const validator = validatorResolvers[engine](schema, schemaOptions, factoryOptions)
    const factValue = isString(fact)
      ? getFactValue(fact, context)
      : isArray(fact) ? [value.value, ...getFactValue(fact, context)]
        : isObject(fact) ? { ...value.value, ...getFactValue(fact, context) }
          : value.value
    const { errors } = await validator(factValue)
    Object.assign(fieldErrors, errors)
  }
  return fieldErrors
}
