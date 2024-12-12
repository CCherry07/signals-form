import { Decision } from "../boolless";
import { Step } from "../stream";
import { ValidateItem } from "../validate";

export interface ComponentMetaData {
  id: string;
  component?: string;
  display?: Decision;
  disabled?: Decision;
}
export function Component(metadata: ComponentMetaData): ClassDecorator {
  return function (target: Function) {
    Object.assign(target.prototype, {
      componentConfig: metadata
    });
  };
}

export interface ValidateMetaData {
  signal?: Record<string, ValidateItem[]>;
  initiative?: Record<string, ValidateItem[]>;
}
export function Validator(metadata: ValidateMetaData): ClassDecorator {
  return function (target: Function) {
    Object.assign(target.prototype, {
      validate: metadata
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
    Object.assign(target.prototype, {
      model2data: metadata.model2data,
      data2model: metadata.data2model
    });
  };
}
