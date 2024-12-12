import { Decision } from "../boolless"
import { FieldError } from "../validate"
import { DecoratorInject } from "./decorator"
export interface FieldControl<T> {
  readonly value: T;
  readonly id: string;
  error: FieldError | undefined;
  disabled: Decision;
  display: Decision;
}

export class Filed<T = any, D = any> implements DecoratorInject<T, D> {
  onBeforeInit(): void {
    throw new Error("Method not implemented.");
  }
  onInit(): void {
    throw new Error("Method not implemented.");
  }
  onDestroy(): void {
    throw new Error("Method not implemented.");
  }
  onDisplay(): void {
    throw new Error("Method not implemented.");
  }
  onDisabled(): void {
    throw new Error("Method not implemented.");
  }
  onValidate(): void {
    throw new Error("Method not implemented.");
  }
  onChange(value: T): void {
    throw new Error("Method not implemented.");
  }
  onValueChange(): void {
    throw new Error("Method not implemented.");
  }
  onBlur(): void {
    throw new Error("Method not implemented.");
  }
  onFocus(): void {
    throw new Error("Method not implemented.");
  }
  public isBlurred: boolean = false
  public isFocused: boolean = false
  public isInit: boolean = false
  public isDestroyed: boolean = false
  public isDisplay: boolean = false
  public isDisabled: boolean = false
  public isValidate: boolean = false
  constructor(public value?: T) {
    this.value = value
  }
}
