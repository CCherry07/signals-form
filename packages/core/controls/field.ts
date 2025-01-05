import { effect, effectScope } from "alien-signals";
import { BoolValues, Decision } from "../boolless";

import {
  EventMetaData, getActionsMetaData, getComponentMetaData,
  getEventsMetaData, getPropsMetaData, getSignalsMetaData,
  getValidatorMetaData, PropsMetaData, SignalsMetaData,
  ValidatorMetaData
} from "./decorator";

import { isFunction, isPromise, set, toValue } from "@rxform/shared";
import { AbstractModelMethods } from "../model/abstract_model";
import { signal, Signal } from "alien-deepsignals";

export enum FiledUpdateType {
  Value = "value",
  Props = "props",
}

export interface FieldError {
  message: string
  type: string
}

export type FieldErrors = Record<string, FieldError>

export class Field<T = any, D = any> {
  id!: string;
  path!: string;
  signalPath!: string;
  parentpath: string = ""
  bools!: BoolValues;
  recoverValueOnHidden?: boolean
  recoverValueOnShown?: boolean
  component?: any;
  hidden?: Decision;
  disabled?: Decision;
  properties?: Field[]
  props?: PropsMetaData;
  validator?: ValidatorMetaData;
  signals?: SignalsMetaData;
  events?: EventMetaData;
  setDefaultValue?: (data?: D) => T;
  onSubmitValue?: (model: T) => D;
  private tracks: Array<Function> = []
  abstractModel!: AbstractModelMethods;
  onBeforeInit?(): void
  onInit?(): void
  onDestroy?(): void
  onDisabled?(state: boolean): void
  onHidden?(state: boolean): void
  onMounted?(): void
  onUnmounted?(): void
  onValidate?(): void

  get value() {
    return this.abstractModel.getFieldValue(this.path)
  }
  peek() {
    return this.abstractModel?.peekFieldValue?.(this.parentpath, this.id)
  }
  set value(v: T) {
    this.abstractModel.setFieldValue(this.path, v)
  }

  onUpdate({
    type,
    value
  }: {
    type: FiledUpdateType,
    value: any
  }): void {
    if (type === "value") {
      const unSignalValue = toValue(value)
      if (this.value === unSignalValue) {
        return
      }
      this.value = unSignalValue as T
    }
    if (type === "props") {
      if (this.props === undefined) {
        throw new Error(`field ${this.id} props is undefined`)
      }
      Object.assign(this.props, value)
    }
    this.tracks.forEach(fn => fn({ type, value }))
  }
  onTrack(fn: Function): void {
    this.tracks.push(fn)
  }
  async _onSubmitValue() {
    const fieldPathLength = this.path.length + 1
    if (isFunction(this.onSubmitValue)) {
      return await this.onSubmitValue(this.peek())
    } else if (this.properties) {
      const model: any = {}
      await Promise.all(this.properties.map(async (field) => {
        return set(model, field.path.slice(fieldPathLength), await field._onSubmitValue())
      }))
      return model
    } else {
      return this.peek()
    }
  }

  public isBlurred: Signal<boolean> = signal(false)
  public isFocused: Signal<boolean> = signal(false)
  public isInit: Signal<boolean> = signal(false)
  public isDestroyed: Signal<boolean> = signal(false)
  public isHidden: Signal<boolean> = signal(false)
  public isDisabled: Signal<boolean> = signal(false)
  public isValid: Signal<boolean> = signal(true)
  public errors: Signal<FieldErrors> = signal({})
  public isPending: Signal<boolean> = signal(true)
  public isMounted: Signal<boolean> = signal(false)
  public $value: T = undefined as unknown as T
  private cleanups: Array<Function> = []
  constructor() {
    this.initFieldMetaDate()
    const e = effectScope()
    e.run(() => {
      // validate
      effect(() => {
        this.isValid.value = Object.keys(this.errors.value).length === 0
      })

      // disabled
      effect(() => {
        this.onDisabled?.(this.isDisabled.value)
      })

      // recover value when hidden and shown
      Promise.resolve().then(() => {
        effect(() => {
          const { isHidden, recoverValueOnHidden, recoverValueOnShown } = this;
          if (isHidden.value && recoverValueOnHidden) {
            this.onHidden?.(this.isHidden.peek())
            return
          };
          if (recoverValueOnShown) {
            if (!isHidden.value && this.$value !== this.peek()) {
              this.value = this.$value;
              this.onHidden?.(this.isHidden.peek())
            } else {
              this.$value = this.peek();
            }
          }
          if (isHidden.value) {
            this.value = undefined as unknown as T;
            this.onHidden?.(this.isHidden.peek())
          }
        })
      })
    })
    this.cleanups.push(e.stop)
  }
  initFieldMetaDate() {
    const componentMeta = getComponentMetaData(this.constructor)
    const actions = getActionsMetaData(this.constructor)
    const eventsMeta = { events: getEventsMetaData(this.constructor) }
    const validatorMeta = { validator: getValidatorMetaData(this.constructor) }
    const signalsMeta = { signals: getSignalsMetaData(this.constructor) }
    const propsMeta = getPropsMetaData(this.constructor) ? { props: getPropsMetaData(this.constructor) } : {}
    
    Object.assign(this, componentMeta, actions, validatorMeta, signalsMeta, eventsMeta, propsMeta)
  }

  resetState() {
    this.isInit.value = true
    this.isPending.value = true
    this.isDisabled.value = false
    this.isHidden.value = false
    this.isBlurred.value = false
    this.isFocused.value = false
    this.isDestroyed.value = false
    this.isValid.value = true
    this.errors.value = {}
    this.$value = undefined as unknown as T
  }

  resetModel(model?: T | Promise<T>) {
    this.isPending.value = true
    const filedValue: any = isFunction(this.setDefaultValue) ? this.setDefaultValue() : model;
    if (isPromise(filedValue)) {
      this.isPending.value = true
      filedValue.then((value) => {
        this.value = value
        this.isPending.value = false
      })
    } else {
      this.value = filedValue!
      this.isPending.value = false
    }
  }

  reset(model?: T) {
    // clean previous state and effect
    this.resetState()
    this.onBeforeInit?.()
    const filedValue: any = isFunction(this.setDefaultValue) ? this.setDefaultValue() : model;
    if (isPromise(filedValue)) {
      filedValue.then((value) => {
        this.value = value
        this.isPending.value = false
      })
    } else {
      this.value = filedValue!
      this.isPending.value = false
    }
  }

  init(model?: T) {
    this.value = undefined as unknown as T
    this.resetState()
    const filedValue: any = isFunction(this.setDefaultValue) ? this.setDefaultValue() : model;
    if (this.properties) {
      const fields = Object.values(this.properties!)
      if (isPromise(filedValue)) {
        filedValue.then((value) => {
          fields.forEach((field) => {
            field.init(value?.[field.id])
          })
          this.isPending.value = false
        })
      } else {
        fields.forEach((field) => {
          field.init(filedValue?.[field.id])
        })
        this.isPending.value = false
      }
    }
  }

  evaluateDecision(decision: Decision) {
    return decision.evaluate(this.bools)
  }

  setFieldErrors(errors: FieldErrors) {
    this.abstractModel.setFieldErrors(this.path, errors)
  }

  setErrors(errors: Record<string, FieldError>) {
    this.errors.value = {
      ...this.errors.value,
      ...errors
    }
  }

  cleanErrors(paths?: string[]) {
    if (paths === undefined) {
      this.errors.value = {};
      this.abstractModel.cleanErrors([this.path])
      return;
    }
    paths.forEach(p => {
      delete this.errors.value[p]
    })
  }
}
