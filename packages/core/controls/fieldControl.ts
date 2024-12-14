import { batch, signal, Signal } from "@preact/signals-core";
import { Decision } from "../boolless"
import { FieldError, FieldErrors } from "../validate"
import type { DecoratorInject } from "./decorator"
export interface FieldControl<T> {
  readonly value: T;
  readonly id: string;
  error: FieldError | undefined;
  disabled: Decision;
  display: Decision;
}

export class Filed<T = any, D = any> implements DecoratorInject<T, D> {
  value?: T | undefined;
  tracks: Array<Function> = []
  onBeforeInit(): void {
  }
  onInit(): void {
  }
  onDestroy(): void {
  }
  onDisplay(): void {
  }
  onDisabled(): void {
  }
  onValidate(): void {
  }
  onChange(this: Filed<T, D>, _value: T): T {
    return _value
  }
  onValueChange(this: Filed<T, D>, _value: T): T {
    return _value
  }
  onBlur(this: Filed<T, D>, _value: T): T {
    batch(() => {
      this.isFocused.value = false
      this.isBlurred.value = true
    })
    return _value
  }
  onFocus(): void {
    batch(() => {
      this.isBlurred.value = false
      this.isFocused.value = true
    })
  }
  onUpdate(filed: Partial<Filed>): void {
    this.tracks.forEach(fn => fn(filed))
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
  public isValidate: Signal<boolean> = signal(false)
  public errors: Signal<FieldErrors> = signal({})
  constructor() {

  }
}
