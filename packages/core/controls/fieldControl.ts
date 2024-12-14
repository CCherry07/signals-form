import { effect, signal, Signal } from "@preact/signals-core";
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
  onBeforeInit?(): void
  onInit?(): void
  onDestroy?(): void
  onDisplay?(): void
  onDisabled?(): void
  onValidate?(): void
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
  public isValid: Signal<boolean> = signal(true)
  public errors: Signal<FieldErrors> = signal({})
  constructor() {
    effect(() => {
      this.isValid.value = Object.keys(this.errors.value).length === 0
    })
  }
}
