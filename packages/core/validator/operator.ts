export enum MatchOperator {
  Equal = "equal",
  NotEqual = "notEqual",
  GreaterThan = "greaterThan",
  GreaterThanOrEqual = "greaterThanOrEqual",
  LessThan = "lessThan",
  LessThanOrEqual = "lessThanOrEqual",
  In = "in",
  NotIn = "notIn",
  Contains = "contains",
  NotContains = "notContains",
  IsEmpty = "isEmpty",
  IsNotEmpty = "isNotEmpty",
  IsNull = "isNull",
  IsNotNull = "isNotNull",
}

export const MatchOperatorMap = {
  [MatchOperator.Equal]: (factValue: any, value: any) => {
    return factValue === value
  },
  [MatchOperator.NotEqual]: (factValue: any, value: any) => {
    return factValue !== value
  },
  [MatchOperator.GreaterThan]: (factValue: any, value: any) => {
    return factValue > value
  },
  [MatchOperator.GreaterThanOrEqual]: (factValue: any, value: any) => {
    return factValue >= value
  },
  [MatchOperator.LessThan]: (factValue: any, value: any) => {
    return factValue < value
  },

  [MatchOperator.LessThanOrEqual]: (factValue: any, value: any) => {
    return factValue <= value
  },
  [MatchOperator.In]: (factValue: any, value: any) => {
    return value.includes(factValue)
  },
  [MatchOperator.NotIn]: (factValue: any, value: any) => {
    return !value.includes(factValue)
  },
  [MatchOperator.Contains]: (factValue: any, value: any) => {
    return factValue.includes(value)
  },
  [MatchOperator.NotContains]: (factValue: any, value: any) => {
    return !factValue.includes(value)
  },

  [MatchOperator.IsEmpty]: (value: any) => {
    return value === ""
  },

  [MatchOperator.IsNotEmpty]: (value: any) => {
    return value !== ""
  },

  [MatchOperator.IsNull]: (value: any) => {
    return value === null
  },

  [MatchOperator.IsNotNull]: (value: any) => {
    return value !== null
  }
}

// export const registerCustomOperator = (operator: MatchOperator, operatorExecutor: (factValue: any, value: any) => boolean) => {
//   MatchOperatorMap[operator] = operatorExecutor
// }

export const operatorExecutor = (factValue: any, value: any, operator: MatchOperator) => {
  return MatchOperatorMap[operator](factValue, value)
}
