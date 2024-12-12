import { Decision } from "../boolless";
import { Step } from "../stream";
import { ValidateItem } from "../validate";

export interface ComponentMetaData {
  id: string;
  component?: any;
  display?: Decision;
  disabled?: Decision;
}
export function Component(metadata: ComponentMetaData): ClassDecorator {
  return function (target: Function) {
    Object.assign(target.prototype, metadata);
  };
}

export interface ValidatorMetaData {
  signal?: Record<string, ValidateItem[]>;
  initiative?: Record<string, ValidateItem[]>;
}
export function Validator(metadata: ValidatorMetaData): ClassDecorator {
  return function (target: Function) {
    Object.assign(target.prototype, {
      validator: metadata
    });
  };
}

export type SignalMetaData = Record<string, Step>;
export function Signal(metadata: SignalMetaData): ClassDecorator {
  return function (target: Function) {
    Object.assign(target.prototype, {
      signal: metadata
    });
  };
}

export type EventMetaData = Record<string, Step[]>;
export function Events(metadata: EventMetaData): ClassDecorator {
  return function (target: Function) {
    Object.assign(target.prototype, {
      events: metadata
    });
  };
}

export interface ModelPipeMetaData<T, D> {
  model2data?: (model: T) => D
  data2model?: (data: D) => T
};
export function ModelPipe<T, D>(metadata: ModelPipeMetaData<T, D>) {
  return function (target: Function) {
    Object.assign(target.prototype, metadata);
  };
}

export interface DecoratorInject <T = any, D = any>{
  id?: string;
  component?: any;
  display?: Decision;
  disabled?: Decision;
  value?: T;
  validator?: ValidatorMetaData;
  signal?: SignalMetaData;
  events?: EventMetaData;
  data2model?: (data?: D) => T;
  model2data?: (model: T) => D;
}
