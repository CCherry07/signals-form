import type { BoolContext, Decision } from "../boolless"
import type { FactoryOptions, Resolver } from "../resolvers/type"

export interface ValidateItem {
  schema: any
  engine?: string
  fact?: string | object
  updateOn?: string | string[]
  needValidate?: Decision
  factoryOptions?: FactoryOptions
  schemaOptions?: any
}

export interface Context<T> {
  state: T
  updateOn: string
  defaultValidatorEngine: string
  model: Record<string, any>
  boolValues: BoolContext
}

export type ValidatorResolvers = Record<string, Resolver>
