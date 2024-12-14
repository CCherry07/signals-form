import { Signal } from "@preact/signals-core";
import { Decision } from "../boolless";
import { Step } from "../stream";
import { ValidateItem } from "../validate";
import { Filed } from "./fieldControl";

export interface ComponentMetaData {
  id: string;
  component?: any;
  display?: Decision;
  disabled?: Decision;
  props?: PropsMetaData
  properties?: { [key: string]: Filed }
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

export type SignalsMetaData = Record<string, Step[]>;
export function Signals(metadata: SignalsMetaData): ClassDecorator {
  return function (target: Function) {
    Object.assign(target.prototype, {
      signals: metadata
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

export interface PropsMetaData {
  [key: string]: any;
}
export function Props(metadata: PropsMetaData): ClassDecorator {
  return function (target: Function) {
    Object.assign(target.prototype, {
      props: metadata
    });
  };
}

export interface DecoratorInject<T = Signal<any>, D = any> {
  id?: string;
  component?: any;
  display?: Decision;
  disabled?: Decision;
  properties?: { [key: string]: Filed }
  value?: T;
  props?: PropsMetaData;
  validator?: ValidatorMetaData;
  signals?: SignalsMetaData;
  events?: EventMetaData;
  data2model?: (data?: D) => T;
  model2data?: (model: T) => D;
}
