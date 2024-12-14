import { effect, signal, Signal } from "@preact/signals-core";
import { Decision } from "../boolless"
import { FieldError, FieldErrors } from "../validate"
import type { DecoratorInject } from "./decorator"
import { isSignal, toValue } from "@rxform/shared";

export enum FiledUpdateType {
  Value = "value",
  Props = "props",
}

export interface FieldControl<T> {
  readonly value: T;
  readonly id: string;
  error: FieldError | undefined;
  disabled: Decision;
  display: Decision;
}
export interface AbstractModelMethods {
  setFieldValue: (field: string, value: any) => void;
  setErrors: (errors: FieldErrors) => void;
  validateField: (field: string) => Promise<boolean>;
  setFieldProps: (field: string, props: any) => void;
}
export class Filed<T = Signal<any>, D = any> implements DecoratorInject<T, D> {
  value?: T | undefined;
  private tracks: Array<Function> = []
  abstractModel: AbstractModelMethods | undefined;
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
        // @ts-ignore
        throw new Error(`field ${this.id!} value is undefined`)
      }
      this.value.value = toValue(value)
    }
    if (type === "props") {
      // @ts-ignore
      if (this.props === undefined) {
        // @ts-ignore
        throw new Error(`field ${this.id!} props is undefined`)
      }
      // @ts-ignore
      Object.assign(this.props, value)
    }
    this.tracks.forEach(fn => fn({ type, value }))
  }
  onTrack(fn: Function): void {
    this.tracks.push(fn)
  }
  public isBlurred: Signal<boolean> = signal(false)
  public isFocused: Signal<boolean> = signal(false)
  public isInit: Signal<boolean> = signal(false)
  public isDestroyed: Signal<boolean> = signal(false)
  public isDisplay: Signal<boolean> = signal(false)
  public isDisabled: Signal<boolean> = signal(false)
  public isValid: Signal<boolean> = signal(true)
  public errors: Signal<FieldErrors> = signal({})
  constructor() {
    effect(() => {
      this.isValid.value = Object.keys(this.errors.value).length === 0
    })
  }
}
