import { isProd, isArray, isString, isFunction, isEmpty } from "@signals-form/shared"
import type { AbstractModel } from "../model/abstract_model"
import { FieldError } from "../types/field"
import { Resolver } from "../types/resolvers";
import { Context, ValidateItem, ValidatorResolvers } from "../types/validator";

export function setup(this: AbstractModel<any>, validator: string, resolver: Resolver) {
  if (!isProd && this.validatorResolvers[validator]) {
    console.warn(`${validator} is already registered`);
  }
  this.validatorResolvers[validator] = resolver
}

export const validate = async <T>(
  {
    value,
    updateOn: _updateOn,
    model,
    execDecision,
    defaultValidatorEngine
  }: Context<T>,
  validates: ValidateItem<T>[],
  validatorResolvers: ValidatorResolvers
): Promise<Record<string, FieldError>> => {
  let fieldErrors = {} as Record<string, FieldError>
  for (const item of validates) {
    const { schema, engine = defaultValidatorEngine, fact, updateOn, schemaOptions, factoryOptions, needValidate } = item

    if (needValidate && !execDecision(needValidate)) continue

    if (
      _updateOn &&
      (isString(updateOn) && updateOn !== _updateOn || isArray(updateOn) && updateOn.length && updateOn.includes(_updateOn))
    ) continue

    if (!isFunction(validatorResolvers[engine])) {
      throw new Error(`validator ${engine} is not registered`)
    }

    const validator = validatorResolvers[engine](schema, schemaOptions, factoryOptions)
    const factValue = fact ? fact(value, model, execDecision) : value
    const { errors } = await validator(factValue)
    if (!isEmpty(errors)) {
      fieldErrors = errors
      break
    }
  }
  return fieldErrors
}

export const formatValidateItem = <T>(items: ValidateItem<T>[] | ValidateItem<T> | Object): ValidateItem<T>[] => {
  if (isArray(items)) {
    return items.map(i => i?.schema ? i : { schema: i })
  } else if ((items as ValidateItem<T>)?.schema) {
    return [items as ValidateItem<T>]
  } else {
    return [{
      schema: items as Object
    }]
  }
}
