import { Decision } from "../boolless";
import { Step } from "../stream";
import { ValidateItem } from "../validate";

export interface ComponentMetaData {
  id: string;
  component?: string;
  display?: Decision;
  disabled?: Decision;
}
export function Component(metadata: ComponentMetaData) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      id = metadata.id;
      component = metadata.component;
      display = metadata.display;
      disabled = metadata.disabled;
    };
  };
}

export interface ValidatorMetaData {
  signal?: Record<string, ValidateItem[]>;
  initiative?: Record<string, ValidateItem[]>;
}
export function Validator(metadata: ValidatorMetaData) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      validate = metadata;
    }
  };
}

export type SignalMetaData = Record<string, Step>;
export function Signal(metadata: SignalMetaData) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      signal = metadata;
    }
  };
}

export type EventMetaData = Record<string, Step[]>;
export function Events(metadata: EventMetaData) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      events = metadata;
    }
  };
}

export interface ModelPipeMetaData<T, D> {
  model2data?: (model: T) => D
  data2model?: (data?: D) => T
};
export function ModelPipe<T, D>(metadata: ModelPipeMetaData<T, D>) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      model2data = metadata.model2data;
      data2model = metadata.data2model;
    }
  }
}
export interface DecoratorInject <T = any, D = any>{
  id: string;
  component?: string;
  display?: Decision;
  disabled?: Decision;
  value?: T;
  validate?: ValidatorMetaData;
  signal?: SignalMetaData;
  events?: EventMetaData;
  data2model?: (data?: D) => T;
  model2data?: (model: T) => D;
}
