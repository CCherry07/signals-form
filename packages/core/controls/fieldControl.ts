import { signal, Signal } from "@preact/signals-core";
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
  onChange(this: Filed<T, D>, _value: T): void {
  }
  onValueChange(): void {
  }
  onBlur(): void {
  }
  onFocus(): void {
  }
  public isBlurred: boolean = false
  public isFocused: boolean = false
  public isInit: boolean = false
  public isDestroyed: boolean = false
  public isDisplay: boolean = false
  public isDisabled: boolean = false
  public isValidate: boolean = false
  public errors: Signal<FieldErrors> = signal({})
  constructor(public value?: T) {
    this.value = value
  }
}
