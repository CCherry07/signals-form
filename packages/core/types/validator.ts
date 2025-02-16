import type { Decision, BoolFn, Node } from "../boolless"
import type { FactoryOptions, Resolver } from "./resolvers"

export interface ValidateItem<T = any> {
  schema: any
  engine?: string
  fact?: (value: T, model: Record<string, any>,
    execDecision: (decision: Decision<string | BoolFn | Node>) => boolean) => any
  updateOn?: string | string[]
  needValidate?: Decision<string | BoolFn | Node>
  factoryOptions?: FactoryOptions
  schemaOptions?: any
}

export interface Context<T> {
  value: T
  defaultValidatorEngine: string
  execDecision: (decision: Decision<string | BoolFn | Node>) => boolean
  model: Record<string, any>
  updateOn?: string
}

export type ValidatorResolvers = Record<string, Resolver>
