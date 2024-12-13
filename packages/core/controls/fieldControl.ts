import { computed, effect, signal, Signal } from "@preact/signals-core";
import { Decision } from "../boolless"
import { FieldError, FieldErrors } from "../validate"
import type { DecoratorInject } from "./decorator"
import { toDeepValue } from "@rxform/shared";
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
    this.isBlurred = true
    return _value
  }
  onFocus(): void {
    this.isFocused = true
  }
  private onUpdate(filed: {
    isBlurred: boolean; isFocused: boolean; isInit: boolean; isDestroyed: boolean; isDisplay: boolean; isDisabled: boolean; isValidate: boolean; errors: FieldErrors; value: T | undefined;
    // @ts-ignore
    props: any;
  }): void {
    this.tracks.forEach(fn => fn(filed))
  }
  onTrack(fn: Function): void {
    this.tracks.push(fn)
  }
  public isBlurred: boolean = false
  public isFocused: boolean = false
  public isInit: boolean = false
  public isDestroyed: boolean = false
  public isDisplay: boolean = false
  public isDisabled: boolean = false
  public isValidate: boolean = false
  public errors: Signal<FieldErrors> = signal({})
  constructor() {
    effect(() => {
      const value = toDeepValue(this.value)
      const filed = computed(() => {
        return {
          ...this.props,
          isBlurred: this.isBlurred,
          isFocused: this.isFocused,
          isInit: this.isInit,
          isDestroyed: this.isDestroyed,
          isDisplay: this.isDisplay,
          isDisabled: this.isDisabled,
          isValidate: this.isValidate,
          errors: this.errors.value,
          value,
          // @ts-ignore
        }
      })
      this.onUpdate(filed.value)
    })
  }
}
