import { batch, effect, signal, Signal } from "@preact/signals-core";
import { FieldErrors } from "../validator"
import { Decision } from "../boolless";
import { EventMetaData, getComponentMetaData, getEventsMetaData, getModelPipeMetaData, getPropsMetaData, getSignalsMetaData, getValidatorMetaData, PropsMetaData, SignalsMetaData, ValidatorMetaData } from "./decorator";
import { get, isFunction, isSignal, toValue } from "@rxform/shared";
import { AbstractModelMethods } from "../model/abstract_model";

export enum FiledUpdateType {
  Value = "value",
  Props = "props",
}


export class Field<T = any, D = any> {
  id!: string;
  value!: Signal<T>;
  path!: string;
  recoverValueOnHidden?: boolean
  recoverValueOnShown?: boolean
  component?: any;
  hidden?: Decision;
  disabled?: Decision;
  properties?: { [key: string]: Field }
  props?: PropsMetaData;
  validator?: ValidatorMetaData;
  signals?: SignalsMetaData;
  events?: EventMetaData;
  data2model?: (data?: D) => T;
  model2data?: (model: T) => D;
  private tracks: Array<Function> = []
  abstractModel!: AbstractModelMethods;
  onBeforeInit?(): void
  onInit?(): void
  onDestroy?(): void
  onDisplay?(): void
  onDisabled?(): void
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
  async onSubmit() {
    return isFunction(this.model2data) ? await this.model2data(this.value.value) : this.value.value
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
    effect(() => {
      this.isValid.value = Object.keys(this.errors.value).length === 0
    })
    effect(() => {
      const { isHidden, recoverValueOnHidden, recoverValueOnShown, value, $value } = this;
      if (isHidden.value && recoverValueOnHidden) return;
      if (recoverValueOnShown && value) {
        if (!isHidden.value) {
          value.value = $value.peek();
        } else {
          $value.value = value.value;
        }
      }
      if (isHidden.value && !recoverValueOnShown) {
        value.value = undefined as unknown as T;
      }
    })
  }
  initFieldMetaDate() {
    const componentMeta = getComponentMetaData(this.constructor)
    const modelpipe = getModelPipeMetaData(this.constructor)
    const eventsMeta = { events: getEventsMetaData(this.constructor) }
    const validatorMeta = { validator: getValidatorMetaData(this.constructor) }
    const signalsMeta = { signals: getSignalsMetaData(this.constructor) }
    const propsMeta = getPropsMetaData(this.constructor) ? { props: getPropsMetaData(this.constructor) } : {}
    Object.assign(this, componentMeta, modelpipe, validatorMeta, signalsMeta, eventsMeta, propsMeta)
  }
}
