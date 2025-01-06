import type { SignalValue } from "@rxform/shared";
import type { BoolValues, Decision } from "../boolless";
import type { ValidateItem } from "../validator";
import { Field } from "./field";
import { Signal, effect } from "alien-signals";
import type { Model } from "../model/types";
// @ts-ignore
Symbol.metadata ??= Symbol("Symbol.metadata");
export const METADATA_COMPONENT = Symbol('component:metadata')
export const METADATA_VALIDATOR = Symbol('validator:metadata')
export const METADATA_SIGNALS = Symbol('signals:metadata')
export const METADATA_EVENTS = Symbol('events:metadata')
export const METADATA_ACTIONS = Symbol('actions:metadata')
export const METADATA_PROPS = Symbol('props:metadata')
export const METADATA_DEPS = Symbol('deps:metadata')
export const METADATA_EFFECT = Symbol('effect:metadata')

import mitt from "mitt"
const emitter = mitt();

export interface ComponentMetaData {
  id: string;
  component?: any;
  hidden?: Decision;
  disabled?: Decision;
  props?: PropsMetaData
  recoverValueOnHidden?: boolean
  recoverValueOnShown?: boolean
  properties?: typeof Field[]
}
export function Component(metadata: ComponentMetaData) {
  return function (_constructor: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_COMPONENT] = metadata
  };
}

export interface ValidatorMetaData {
  signal?: Record<string, ValidateItem[]>;
  initiative?: Record<string, ValidateItem[]>;
}
export function Validator(metadata: ValidatorMetaData) {
  return function (_target: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_VALIDATOR] = metadata
  };
}
export type SignalsMetaData = Record<string, (this: Field, value: SignalValue<Field['value']>, bools: BoolValues, model: Signal<Model>) => void>;
export function Signals(metadata: SignalsMetaData) {
  return function (_target: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_SIGNALS] = metadata
  };
}

export type EventMetaData = Record<string, (this: Field, value: SignalValue<Field['value']>) => void>;
export function Events(metadata: EventMetaData) {
  return function (_target: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_EVENTS] = metadata
  };
}

export interface TransferMetaData<T, D> {
  setDefaultValue?: (this: Field, model: T) => D
  onSubmitValue?: (this: Field, data: D) => T
};
export function Actions<T, D>(metadata: TransferMetaData<T, D>) {
  return function (_target: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_ACTIONS] = metadata
  };
}

export interface PropsMetaData {
  [key: string]: any;
}
export function Props(metadata: PropsMetaData) {
  return function (_target: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_PROPS] = metadata
  };
}

export function InjectFields(fields: Field[]) {
  return function (_target: Function, ctx: ClassDecoratorContext) {
    ctx.metadata![METADATA_DEPS] = fields
  };
}

export function Condition(decision: Decision): Function {
  return function (method: any, ctx: ClassMethodDecoratorContext) {
    const fn = function (this: Field) {
      return effect(() => {
        if (this.evaluateDecision(decision)) {
          method.call(this);
        }
      });
    }
    fn._name = ctx.name;
    ctx.addInitializer(function () {
      // @ts-ignore
      (this.$effects ??= []).push(fn);
    });
  };
}

export function DispatchData(name: string): Function {
  return function (target: any, ctx: ClassFieldDecoratorContext) {
    let value = target
    const getter = function () {
      return value;
    };
    const setter = function (data: any) {
      value = data;
      emitter.emit(name, value);
    }
    ctx.addInitializer(function () {
      Object.defineProperty(this, ctx.name, {
        get: getter,
        set: setter
      })
    })
  };
}

export function SubscribeData(name: string) {
  return function (method: any, ctx: ClassMethodDecoratorContext) {
    ctx.addInitializer(function () {
      emitter.on(name, method.bind(this));
    })
  };
}

export function Effect(this: Field) {
  return function (_target: any, _key: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const fn = function (this: Field) {
      return effect(() => {
        method.call(this);
      });
    }
    fn._name = _key;
    (_target.$effects ??= []).push(fn);
  };
}
