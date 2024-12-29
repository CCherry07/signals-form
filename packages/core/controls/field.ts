import { batch, effect, signal, Signal } from "@preact/signals-core";
import { BoolValues, Decision } from "../boolless";
import { EventMetaData, getActionsMetaData, getComponentMetaData, getEventsMetaData, getPropsMetaData, getSignalsMetaData, getValidatorMetaData, PropsMetaData, SignalsMetaData, ValidatorMetaData } from "./decorator";
import { get, isFunction, isPromise, isSignal, set, toDeepValue, toValue } from "@rxform/shared";
import { AbstractModelMethods } from "../model/abstract_model";

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
  value!: Signal<T>;
  path!: string;
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
  onUpdate({
    type,
    value
  }: {
    type: FiledUpdateType,
    value: any
  }): void {
    if (type === "value") {
      if (!isSignal(this.value)) {
        throw new Error(`field ${this.id} value is undefined`)
      }
      const unSignalValue = toValue(value)
      if (this.value.value === unSignalValue) {
        return
      }
      if (this.properties) {
        let properties = this.properties
        let fieldPath = this.path.length + 1
        batch(() => {
          Object.entries(properties).forEach(([_, field]) => {
            const value = get(unSignalValue, field.path.slice(fieldPath))
            field.onUpdate({ type: FiledUpdateType.Value, value })
          })
        })
      } else {
        this.value.value = unSignalValue
      }
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
  async _onSubmit() {
    const fieldPathLength = this.path.length + 1
    if (isFunction(this.onSubmitValue)) {
      return await this.onSubmitValue(toDeepValue(this.value.peek()))
    } else if (this.properties) {
      const model: any = {}
      await Promise.all(Object.values(this.properties).map(async (field) => {
        return set(model, field.path.slice(fieldPathLength), await field._onSubmit())
      }))
      return model
    } else {
      return this.value.peek()
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
  public $value: Signal<T> = signal(undefined as unknown as T)
  constructor() {
    this.initFieldMetaDate()
    // validate
    effect(() => {
      this.isValid.value = Object.keys(this.errors.value).length === 0
    })

    // disabled
    effect(() => {
      this.onDisabled?.(this.isDisabled.value)
    })

    // recover value when hidden and shown
    effect(() => {
      const { isHidden, recoverValueOnHidden, recoverValueOnShown, value, $value } = this;
      if (isHidden.value && recoverValueOnHidden) {
        this.onHidden?.(this.isHidden.peek())
        return
      };
      if (recoverValueOnShown && value) {
        if (!isHidden.value) {
          value.value = $value.peek();
          this.onHidden?.(this.isHidden.peek())
          return
        } else {
          $value.value = value.peek();
        }
      }
      if (isHidden.value) {
        value.value = undefined as unknown as T;
        this.onHidden?.(this.isHidden.peek())
      }
    })
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
    this.$value.value = undefined as unknown as T
  }

  resetModel(model?: T | Promise<T>) {
    this.isPending.value = true
    const filedValue: any = isFunction(this.setDefaultValue) ? this.setDefaultValue() : model;
    if (this.properties) {
      const fields = Object.values(this.properties!)
      if (isPromise(filedValue)) {
        this.isPending.value = true
        filedValue.then((value) => {
          fields.forEach((field) => {
            field.resetModel(value?.[field.id])
          })
          this.isPending.value = false
        })
      } else {
        fields.forEach((field) => {
          field.resetModel(filedValue?.[field.id])
        })
        this.isPending.value = false
      }
    } else {
      if (isPromise(filedValue)) {
        this.isPending.value = true
        filedValue.then((value) => {
          this.value.value = value
          this.isPending.value = false
        })
      } else {
        this.value.value = filedValue!
        this.isPending.value = false
      }
    }
  }

  reset(model?: T) {
    this.resetState()
    const filedValue: any = isFunction(this.setDefaultValue) ? this.setDefaultValue() : model;
    if (this.properties?.length) {
      const fields = this.properties!
      if (isPromise(filedValue)) {
        filedValue.then((value) => {
          fields.forEach((field) => {
            field.reset(value?.[field.id])
          })
          this.isPending.value = false
        })
      } else {
        fields.forEach((field) => {
          field.reset(filedValue?.[field.id])
        })
        this.isPending.value = false
      }
    } else {
      if (isPromise(filedValue)) {
        filedValue.then((value) => {
          this.value.value = value
          this.isPending.value = false
        })
      } else {
        this.value.value = filedValue!
        this.isPending.value = false
      }
    }
  }

  init(model?: T) {
    this.value = signal(undefined as unknown as T)
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
    this.setErrors(errors);
    this.abstractModel.setFieldErrors(this.path, this.errors.value)
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
