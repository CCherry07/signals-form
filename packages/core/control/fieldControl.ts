import { Decision } from "../boolless"
import { Step } from "../stream";
import { FieldError, ValidateItem } from "../validate"
export interface FieldConfig {
  component?: string
  validator?: {
    signal?: Record<string, ValidateItem[]>;
    initiative?: Record<string, ValidateItem[]>;
  }
  signal?: Record<string, Step>;
  events?: Record<string, Step[]>
}

export interface FieldControl<T> {
  readonly value: T;
  readonly id: string;
  error: FieldError | undefined;
  disabled: Decision;
  display: Decision;
}

interface ComponentMetaData {
  id: string;
  component: string;
  display: Decision;
  disabled: Decision;
}
export function Component(metadata: ComponentMetaData): ClassDecorator {
  return function (target: Function) {
    Object.assign(target.prototype, {
      componentConfig: metadata
    });
  };
}

interface ValidateMetaData {
  signal: Record<string, ValidateItem[]>;
  initiative: Record<string, ValidateItem[]>;
}
export function Validator(metadata: ValidateMetaData): ClassDecorator {
  return function (target: Function) {
    Object.assign(target.prototype, {
      validate: metadata
    });
  };
}

type SignalMetaData = Record<string, Step>;
export function Signal(metadata: SignalMetaData): ClassDecorator {
  return function (target: Function) {
    Object.assign(target.prototype, {
      signal: metadata
    });
  };
}

type EventMetaData = Record<string, Step[]>;
export function Events(metadata: EventMetaData): ClassDecorator {
  return function (target: Function) {
    Object.assign(target.prototype, {
      events: metadata
    });
  };
}

interface ModelPipeMetaData<T, D> {
  model2data: (model: T) => D
  data2model: (data: D) => T
};
export function ModelPipe<T, D>(metadata: ModelPipeMetaData<T, D>) {
  return function (target: Function) {
    Object.assign(target.prototype, {
      model2data: metadata.model2data,
      data2model: metadata.data2model
    });
  };
}

interface FiledLifeCycle {
  onBeforeInit(): void
  onInit(): void
  onDestroy(): void
  onChanges(): void
  onBlur(): void
  onFocus(): void
  onDisplay(): void
  onDisabled(): void
  onValueChange(): void
  onValidate(): void
}

export class Filed<T = any, D = any> implements FieldConfig, FiledLifeCycle {
  component?: string | undefined;
  validator?: { signal?: Record<string, ValidateItem[]>; initiative?: Record<string, ValidateItem[]>; };
  signal?: Record<string, Step>;
  events?: Record<string, Step[]>;
  model2data?: (model: T) => D
  data2model?: (data?: D) => T
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
  onChanges(): void {
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
  constructor(public id: string, public value: T) {
    this.id = id
    this.value = value
  }
}
