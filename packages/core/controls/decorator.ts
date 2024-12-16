import { Decision } from "../boolless";
import { Step } from "../stream";
import { ValidateItem } from "../validate";
import { Field } from "./fieldControl";

export const METADATA_COMPONENT = 'component:metadata'
export const METADATA_VALIDATOR = 'validator:metadata'
export const METADATA_SIGNALS = 'signals:metadata'
export const METADATA_EVENTS = 'events:metadata'
export const METADATA_MODEL = 'model:metadata'
export const METADATA_PROPS = 'props:metadata'

export interface ComponentMetaData {
  id: string;
  component?: any;
  display?: Decision;
  disabled?: Decision;
  props?: PropsMetaData
  properties?: { [key: string]: Field }
}
export function Component(metadata: ComponentMetaData): ClassDecorator {
  return function (constructor: Function) {
    Reflect.defineMetadata(METADATA_COMPONENT, metadata, constructor);
  };
}

export function getComponentMetaData(target: Function) {
  return Reflect.getMetadata(METADATA_COMPONENT, target) as ComponentMetaData;
}

export interface ValidatorMetaData {
  signal?: Record<string, ValidateItem[]>;
  initiative?: Record<string, ValidateItem[]>;
}
export function Validator(metadata: ValidatorMetaData): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(METADATA_VALIDATOR, metadata, target);
  };
}

export function getValidatorMetaData(target: Function) {
  return Reflect.getMetadata(METADATA_VALIDATOR, target) as ValidatorMetaData;
}

export type SignalsMetaData = Record<string, Step[]>;
export function Signals(metadata: SignalsMetaData): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(METADATA_SIGNALS, metadata, target);
  };
}

export function getSignalsMetaData(target: Function) {
  return Reflect.getMetadata(METADATA_SIGNALS, target) as SignalsMetaData;
}

export type EventMetaData = Record<string, Step[]>;
export function Events(metadata: EventMetaData): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(METADATA_EVENTS, metadata, target);
  };
}

export function getEventsMetaData(target: Function) {
  return Reflect.getMetadata(METADATA_EVENTS, target) as EventMetaData;
}

export interface ModelPipeMetaData<T, D> {
  model2data?: (model: T) => D
  data2model?: (data: D) => T
};
export function ModelPipe<T, D>(metadata: ModelPipeMetaData<T, D>) {
  return function (target: Function) {
    Reflect.defineMetadata(METADATA_MODEL, metadata, target);
  };
}

export function getModelPipeMetaData<T, D>(target: Function) {
  return Reflect.getMetadata(METADATA_MODEL, target) as ModelPipeMetaData<T, D>;
}

export interface PropsMetaData {
  [key: string]: any;
}
export function Props(metadata: PropsMetaData): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(METADATA_PROPS, metadata, target);
  };
}

export function getPropsMetaData(target: Function) {
  return Reflect.getMetadata(METADATA_PROPS, target) as PropsMetaData;
}
