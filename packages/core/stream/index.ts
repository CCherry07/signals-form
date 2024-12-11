import { Decision } from "../boolless"

export interface Step {
  map?: (value: any) => any
  tap?: (info: any) => void
  effectTarget?: string
  effectProp?: string
  operator?: "toggle" | "onlyone" | "any" |'single'
  condition?: Decision
  single?: string
  do?: Step[]
}
