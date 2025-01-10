import { ComponentClass, createElement, FunctionComponent } from 'react';
import { FieldControl } from "./FieldControl";
import { createRXForm, Field, setupValidator, createGroupForm as createRXGroupForm } from "@rxform/core"
import type { Resolver, FormConfig as CoreFormConfig } from '@rxform/core'
export interface FormConfig extends CoreFormConfig {
  components: Record<string, string | FunctionComponent<any> | ComponentClass<any, any>>;
  resolvers?: {
    validator?: Record<string, Resolver>
  }
}

export interface Extensions {
  name: string
  extension: Function,
  priority?: number
}

export interface Options {
  extensions?: Extensions[],
  provides?: Record<string, any>
}

export const createForm = (config: FormConfig) => {
  const {
    defaultValidatorEngine,
    boolsConfig,
    components,
    resolvers,
    graph,
    id
  } = config;
  const form = createRXForm({
    id,
    defaultValidatorEngine,
    boolsConfig,
    graph
  })

  if (resolvers?.validator) {
    Object.entries(resolvers.validator).forEach(([validator, resolver]) => {
      setupValidator.call(form, validator, resolver)
    })
  }

  function resolveComponent(component: string | FunctionComponent<any> | ComponentClass<any, any>) {
    if (typeof component === 'string') {
      return components[component]
    }
    return component
  }

  const app = createElement('div', {}, form.graph.map((field: Field) => {
    return createElement(FieldControl, {
      key: field.path,
      field,
      model: form.model,
      defaultValidatorEngine,
      validatorResolvers: form.validatorResolvers,
      resolveComponent
    })
  }))

  return {
    app,
    form
  }
}

export const createGroupForm = (options: Options) => {
  const formGroup = createRXGroupForm({
    provides: options.provides
  })
  const apps = new Map<string, JSX.Element>()
  const createApp = (config: FormConfig) => {
    const form = formGroup.create(config)
    function resolveComponent(component: string | FunctionComponent<any> | ComponentClass<any, any>) {
      if (typeof component === 'string') {
        return config.components[component]
      }
      return component
    }

    if (config.resolvers?.validator) {
      Object.entries(config.resolvers.validator).forEach(([validator, resolver]) => {
        setupValidator.call(form, validator, resolver)
      })
    }
    const app = createElement('div', {}, form.graph.map((field: Field) => {
      return createElement(FieldControl, {
        key: field.path,
        field,
        model: form.model,
        defaultValidatorEngine: config.defaultValidatorEngine,
        validatorResolvers: form.validatorResolvers,
        resolveComponent
      })
    }))
    return {
      app,
      form
    }
  }
  return {
    getFormGroup() {
      return formGroup
    },
    add(config: FormConfig) {
      const { app, form } = createApp(config)
      apps.set(config.id, app)
      formGroup.add(config.id, form)
      return {
        app,
        form
      }
    },
    remove(id: string) {
      apps.delete(id)
      formGroup.remove(id)
    },
    get(id: string) {
      return {
        form: formGroup.get(id),
        app: apps.get(id)
      }
    },
  }
}
