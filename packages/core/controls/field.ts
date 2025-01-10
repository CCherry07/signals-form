import { effect, effectScope } from "alien-signals";
import type { BoolValues, Decision } from "../boolless";
import {
  ValidatorMetaData,
  METADATA_ACTIONS,
  METADATA_CONDITIONS,
  METADATA_VALIDATOR,
  METADATA_COMPONENT,
  METADATA_PROVIDE,
  METADATA_INJECT,
} from "../decorators";

import { isFunction, isPromise, set, toValue } from "@rxform/shared";
import { signal, Signal } from "alien-deepsignals";
import type { AbstractModelMethods } from "../model/types";

export interface FieldError {
  message: string
  type: string
}

export type FieldErrors = Record<string, FieldError>

const markOwnkeys: string[] = [
  "id",
  "path",
  "signalPath",
  "parentpath",
  "bools",
  "recoverValueOnHidden",
  "recoverValueOnShown",
  "component",
  "hidden",
  "disabled",
  "properties",
  "validator",
  "setDefaultValue",
  "onSubmitValue",
  "tracks",
  "abstractModel",
  "appContext",
  "parent",
  "provides",
  "actions",
  "$effects",
  "$value",
  "markOwnkeys"
]

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
  setDefaultValue?: (data?: D) => T;
  onSubmitValue?: (model: T) => D;
  private tracks: Array<Function> = []
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

  onBeforeInit?(): void
  onInit?(): void
  onDestroy?(): void
  onDisabled?(state: boolean): void
  onHidden?(state: boolean): void
  onMounted?(): void
  onUnmounted?(): void
  onValidate?(): void

  get value() {
    return this.abstractModel.getFieldValue(this.path)
  }
  peek() {
    return this.abstractModel?.peekFieldValue?.(this.parentpath, this.id)
  }
  set value(v: T) {
    this.abstractModel.setFieldValue(this.path, v)
  }

  update() {
    this.tracks.forEach(fn => fn())
  }

  setValue(v: T) {
    this.value = v
  }

  setProps(props: Record<string, any>) {
    Object.assign(this, props)
    this.update()
  }

  setProp(this: Field & Record<string, any>, prop: string, value: any) {
    this[prop] = value
    this.update()
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
  public isPending: Signal<boolean> = signal(true)
  public isMounted: Signal<boolean> = signal(false)
  public $value: T = undefined as unknown as T
  private cleanups: Array<Function> = []
  constructor() {
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
        };
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
    this.normalizeFieldMetaDate()
  }

  normalizeFieldMetaDate() {
    const constructor = this.constructor as any
    const componentMeta = constructor[Symbol.metadata][METADATA_COMPONENT] ?? {}
    const actions = constructor[Symbol.metadata][METADATA_ACTIONS] ?? {}
    this.actions = actions
    const validatorMeta = { validator: constructor[Symbol.metadata][METADATA_VALIDATOR] ?? {} }
    const conditions = constructor[Symbol.metadata][METADATA_CONDITIONS] ?? {}
    this.$effects = Object.values(conditions);

    const provides: Function[] = constructor[Symbol.metadata][METADATA_PROVIDE] ?? []
    provides.forEach((provide) => {
      provide.call(this)
    })
    // console.log(JSON.stringify(this.provides));
    // const properties = (componentMeta.properties ??= []).map((Property: typeof Field) =>  {
    //   const field = new Property()
    //   field.parent = this
    //   field.parentpath = this.path
    //   // injects.forEach((inject) => {
    //   //   inject.call(this)
    //   // })
    //   console.log("init");

    //   return field
    // });
    // componentMeta.properties = properties
    Object.assign(this, componentMeta, validatorMeta)
  }

  resetState() {
    this.isInit.value = true
    this.isPending.value = true
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
    this.isPending.value = true
    const filedValue: any = isFunction(this.setDefaultValue) ? this.setDefaultValue() : model;
    if (isPromise(filedValue)) {
      this.isPending.value = true
      filedValue.then((value) => {
        this.value = value
        this.isPending.value = false
      })
    } else {
      this.value = filedValue!
      this.isPending.value = false
    }
  }

  reset(model?: T) {
    // clean previous state and effect
    this.resetState()
    this.onBeforeInit?.()
    // @ts-ignore
    const injects: Function[] = this.constructor[Symbol.metadata][METADATA_INJECT] ?? []
    injects.forEach((inject) => {
      inject.call(this)
    })
    const filedValue: any = isFunction(this.actions.setDefaultValue) ? this.actions.setDefaultValue() : model;
    if (this.properties?.length && filedValue === undefined) {
      this.isPending.value = false
      return
    }
    if (isPromise(filedValue)) {
      filedValue.then((value) => {
        this.value = value
        this.isPending.value = false
      })
    } else {
      this.value = filedValue!
      this.isPending.value = false
    }
  }

  init(model?: T) {
    this.value = undefined as unknown as T
    this.resetState()
    const filedValue: any = isFunction(this.setDefaultValue) ? this.setDefaultValue() : model;
    if (this.properties) {
      const fields = Object.values(this.properties!)
      if (isPromise(filedValue)) {
        filedValue.then((value) => {
          fields.forEach((field) => {
            field.init(value?.[field.id])
          })
          this.isPending.value = false
        })
      } else {
        fields.forEach((field) => {
          field.init(filedValue?.[field.id])
        })
        this.isPending.value = false
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

  getStateToProps() {
    const entries = Object.getOwnPropertyNames(this).filter((key) => {
      if (markOwnkeys.includes(key)) {
        return false
      }
      return true
    }).map(key => {
      return [key, toValue((this as Record<string, any>)[key])]
    }).concat(
      [
        [
          'value',
          this.value
        ]
      ]
    )
    return Object.fromEntries(
      entries
    )
  }
}
