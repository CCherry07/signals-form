import type { Decision } from "../boolless"
import type { FactoryOptions, Resolver } from "../resolvers/type"

export interface ValidateItem <T>{
  schema: any
  engine?: string
  fact?: (value: T, model: Record<string, any>, execDecision: (decision: Decision) => boolean) => any
  updateOn?: string | string[]
  needValidate?: Decision
  factoryOptions?: FactoryOptions
  schemaOptions?: any
}

export interface Context<T> {
  value: T
  defaultValidatorEngine: string
  execDecision: (decision: Decision) => boolean
  model: Record<string, any>
  updateOn?: string
}

export type ValidatorResolvers = Record<string, Resolver>
