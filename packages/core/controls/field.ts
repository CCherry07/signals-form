import { effect, effectScope } from "alien-signals";
import { signal, Signal } from "alien-deepsignals";
import { isFunction, isPromise, set, toValue } from "@rxform/shared";

import type { BoolValues, Decision } from "../boolless";
import {
  METADATA_ACTIONS,
  METADATA_COMPONENT,
  METADATA_CONDITIONS,
  METADATA_EFFECT,
  METADATA_EVENT,
  METADATA_INJECT,
  METADATA_INJECTFIELD,
  METADATA_PROP,
  METADATA_PROVIDE,
  METADATA_VALIDATOR,
  ValidatorMetaData,
} from "../decorators";
import { emitter } from "../emitter";

import type { AbstractModelMethods } from "../model/types";

export interface FieldError {
  message: string
  type: string
}

const needInjectPropKeys = [
  "isUpdating",
  "isBlurred",
  "isFocused",
  "isInit",
  "isDestroyed",
  "isHidden",
  "isDisabled",
  "isValid",
  "errors",
  "isMounted",
  "value"
]

export type FieldErrors = Record<string, FieldError>

export class Field<T = any, D = any> {
  id!: string;
  path!: string;
  signalPath!: string;
  parentpath: string = ""
  bools!: BoolValues;
  recoverValueOnHidden?: boolean
  recoverValueOnShown?: boolean
  component?: any;
  hidden?: Decision;
  disabled?: Decision;
  properties?: Field[]
  validator?: ValidatorMetaData;
  onSubmitValue?: (model: T) => D;
  private tracks: Array<Function> = []
  // @ts-ignore
  private deps: Record<string, Field> = {}
  private effectFields: Set<Field> = new Set()
  abstractModel!: AbstractModelMethods;
  appContext: {
    provides?: Record<string, any>
  } = {}
  parent: Field | null = null
  provides: Record<string | symbol, any> = {}
  actions: {
    setDefaultValue?: (data?: D) => T;
    onSubmitValue?: (model: T) => D;
  } = {};

  // to Component props
  methods: Record<string, Function> = {}

  // ignore to Component props
  get emitter() {
    return emitter
  }

  onBeforeInit?(): void
  onInit?(): void
  onDestroy?(): void
  onDisabled?(state: boolean): void
  onHidden?(state: boolean): void
  onMounted?(): void
  onUnmounted?(): void
  onValidate?(): void

  private _isUpdating: Signal<boolean> = signal(true)
  get isUpdating() {
    return this._isUpdating.value
  }

  set isUpdating(v: boolean) {
    this._isUpdating.value = v
    if (v === true) {
      this.effectFields.forEach((field) => {
        field.isUpdating = true
      })
    }
  }

  get isRoot() {
    return this.parent === null
  }

  get isLeaf() {
    return this.properties === undefined
  }

  appendEffectField(field: Field) {
    this.effectFields.add(field)
  }

  get value() {
    return this.abstractModel.getFieldValue(this.path)
  }

  peek() {
    return this.abstractModel?.peekFieldValue?.(this.parentpath, this.id)
  }

  set value(v: T) {
    this.abstractModel.setFieldValue(this.path, v)
    this.isUpdating = false
  }

  update() {
    this.tracks.forEach(fn => fn())
  }

  onTrack(fn: Function): void {
    this.tracks.push(fn)
  }

  async _onSubmitValue() {
    const fieldPathLength = this.path.length + 1
    if (isFunction(this.onSubmitValue)) {
      return await this.onSubmitValue(this.peek())
    } else if (this.properties) {
      const model: any = {}
      await Promise.all(this.properties.map(async (field) => {
        return set(model, field.path.slice(fieldPathLength), await field._onSubmitValue())
      }))
      return model
    } else {
      return this.peek()
    }
  }

  $effects: any[] = []

  public isBlurred: Signal<boolean> = signal(false)
  public isFocused: Signal<boolean> = signal(false)
  public isInit: Signal<boolean> = signal(false)
  public isDestroyed: Signal<boolean> = signal(false)
  public isHidden: Signal<boolean> = signal(false)
  public isDisabled: Signal<boolean> = signal(false)
  public isValid: Signal<boolean> = signal(true)
  public errors: Signal<FieldErrors> = signal({})
  public isMounted: Signal<boolean> = signal(false)
  public $value: T = undefined as unknown as T
  private cleanups: Array<Function> = []

  private injectFields: Record<string, string> = {}

  private propKeys: string[] = needInjectPropKeys
  private eventKeys: string[] = []

  constructor() {
    this.normalizeFieldMetaDate()
    const e = effectScope()
    e.run(() => {
      // validate
      effect(() => {
        this.isValid.value = Object.keys(this.errors.value).length === 0
      })

      // disabled
      effect(() => {
        this.onDisabled?.(this.isDisabled.value)
      })

      // recover value when hidden and shown
      effect(() => {
        const { isHidden, recoverValueOnHidden, recoverValueOnShown } = this;
        if (isHidden.value && recoverValueOnHidden) {
          this.onHidden?.(this.isHidden.peek())
          return
        }
        if (recoverValueOnShown) {
          if (!isHidden.value && this.$value !== this.peek()) {
            this.value = this.$value;
            this.onHidden?.(this.isHidden.peek())
          } else {
            this.$value = this.peek();
          }
        }
        if (isHidden.value) {
          this.value = undefined as unknown as T;
          this.onHidden?.(this.isHidden.peek())
        }
      })
    })
    this.cleanups.push(e.stop)
  }

  normalizeFieldMetaDate() {
    const constructor = this.constructor as any
    const componentMeta = constructor[Symbol.metadata][METADATA_COMPONENT] ?? {}
    this.actions = constructor[Symbol.metadata][METADATA_ACTIONS] ?? {}
    const conditions = constructor[Symbol.metadata][METADATA_CONDITIONS] ?? {}
    this.$effects = Object.values(conditions);

    const provides: Function[] = constructor[Symbol.metadata][METADATA_PROVIDE] ?? []
    provides.forEach((provide) => {
      provide.call(this)
    })

    this.injectFields = constructor[Symbol.metadata][METADATA_INJECTFIELD] ?? {}
    this.validator = constructor[Symbol.metadata][METADATA_VALIDATOR] ?? {}

    this.propKeys.push(...constructor[Symbol.metadata][METADATA_PROP] ?? [])
    this.eventKeys = constructor[Symbol.metadata][METADATA_EVENT] ?? []

    Object.assign(this, componentMeta)
  }

  // all fields are initialized, we can inject fields now
  normalizeDeps() {
    this.deps = Object.fromEntries(
      Object.entries(this.injectFields)
        .map(([key, value]) => {
          const targetField = this.abstractModel.getField(value)
          targetField.appendEffectField(this)
          return [key, this.abstractModel.getField(value)]
        }))

    this.normalizeEffects()
  }

  getDepsValue(deps?: string | string[] | Record<string, string>,) {
    let injectValues: any = undefined
    if (Array.isArray(deps)) {
      injectValues = deps.map((dep: string) => this.deps[dep].value)
    } else if (typeof deps === 'object') {
      injectValues = Object.fromEntries(Object.entries(deps).map(([key, dep]) => {
        return [key, this.deps[dep as string].value]
      })
      )
    } else if (typeof deps === 'string') {
      injectValues = this.deps[deps].value
    }
    return injectValues
  }

  getDepsCombinedUpdating(deps?: string | string[] | Record<string, string>) {
    if (deps === undefined) {
      return Object.values(this.deps).some(dep => dep.isUpdating)
    }
    if (Array.isArray(deps)) {
      return deps.some(dep => this.deps[dep].isUpdating)
    } else if (typeof deps === 'object') {
      return Object.values(deps).some(dep => this.deps[dep as string].isUpdating)
    } else if (typeof deps === 'string') {
      return this.deps[deps].isUpdating
    }
  }

  normalizeEffects() {
    const effects: Function[] = (this.constructor as any)[Symbol.metadata][METADATA_EFFECT] ?? []
    effects.forEach((effect) => {
      effect.call(this)
    })
  }

  resetState() {
    this.isInit.value = true
    this.isUpdating = true
    this.isDisabled.value = false
    this.isHidden.value = false
    this.isBlurred.value = false
    this.isFocused.value = false
    this.isDestroyed.value = false
    this.isValid.value = true
    this.errors.value = {}
    this.$value = undefined as unknown as T
  }

  resetModel(model?: T | Promise<T>) {
    this.isUpdating = true
    const filedValue: any = isFunction(this.actions.setDefaultValue) ? this.actions.setDefaultValue() : model;
    if (isPromise(filedValue)) {
      this.isUpdating = true
      filedValue.then((value) => {
        this.value = value
      })
      this.isUpdating = false
    } else {
      this.value = filedValue!
      this.isUpdating = false
    }
  }

  reset(model?: T) {
    // clean previous state and effect
    this.resetState()
    this.onBeforeInit?.()
    const injects: Function[] = (this.constructor as any)[Symbol.metadata][METADATA_INJECT] ?? []
    injects.forEach((inject) => {
      inject.call(this)
    })
    const filedValue: any = isFunction(this.actions.setDefaultValue) ? this.actions.setDefaultValue() : model;
    if (this.properties?.length && filedValue === undefined) {
      this.isUpdating = false
      return
    }
    if (isPromise(filedValue)) {
      filedValue.then((value) => {
        this.value = value
        this.isUpdating = false
      })
    } else {
      this.value = filedValue!
      this.isUpdating = false
    }
  }

  init(model?: T) {
    this.value = undefined as unknown as T
    this.resetState()
    const filedValue: any = isFunction(this.actions.setDefaultValue) ? this.actions.setDefaultValue() : model;
    if (this.properties) {
      const fields = Object.values(this.properties!)
      if (isPromise(filedValue)) {
        filedValue.then((value) => {
          fields.forEach((field) => {
            field.init(value?.[field.id])
          })
          this.isUpdating = false
        })
      } else {
        fields.forEach((field) => {
          field.init(filedValue?.[field.id])
        })
        this.isUpdating = false
      }
    }
  }

  evaluateDecision(decision: Decision) {
    return decision.evaluate(this.bools)
  }

  setFieldErrors(errors: FieldErrors) {
    this.abstractModel.setFieldErrors(this.path, errors)
  }

  setErrors(errors: Record<string, FieldError>) {
    this.errors.value = {
      ...this.errors.value,
      ...errors
    }
  }

  cleanErrors(paths?: string[]) {
    if (paths === undefined) {
      this.errors.value = {};
      this.abstractModel.cleanErrors([this.path])
      return;
    }
    paths.forEach(p => {
      delete this.errors.value[p]
    })
  }

  getProps() {
    const entries = this.propKeys.map(key => [key, toValue((this as Record<string, any>)[key])])
    return Object.fromEntries(entries)
  }

  getEvents() {
    const entries = this.eventKeys.map(key => [key, (this as Record<string, any>)[key].bind(this)])
    return Object.fromEntries(entries)
  }
}
