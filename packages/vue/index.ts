import { FieldControl } from "./FieldControl";
import { createRXForm, Field, setupValidator, createGroupForm as createRXGroupForm } from "@rxform/core"
import { Resolver } from '@rxform/core/validator/resolvers/type';
import { Component, DefineComponent, h } from "vue";

interface FormConfig {
  components: Record<string, Component | DefineComponent>;
  graph: typeof Field[];
  validatorEngine?: string;
  defaultValidatorEngine?: string;
  boolsConfig: Record<string, (...args: any[]) => boolean>;
  id: string;
  resolvers?: {
    validator?: Record<string, Resolver>
  }
}
export const createForm = (config: FormConfig) => {
  const {
    graph,
    validatorEngine = 'zod',
    defaultValidatorEngine = 'zod',
    boolsConfig,
    components,
    resolvers,
    id
  } = config;
  const form = createRXForm({
    id,
    validatorEngine,
    defaultValidatorEngine,
    boolsConfig,
    graph,
  })

  if (resolvers?.validator) {
    Object.entries(resolvers.validator).forEach(([validator, resolver]) => {
      setupValidator(validator, resolver)
    })
  }

  function resolveComponent(component: string | Component | DefineComponent): Component | DefineComponent {
    if (typeof component === 'string') {
      return components[component]
    }
    return component
  }
  const app = h('div', null, form.graph.map((field) => {
    return h(FieldControl, {
      key: field.path,
      field: field,
      model: form.model,
      resolveComponent
    })
  }))

  return {
    app,
    form
  }
}

export const createGroupForm = () => {
  const formGroup = createRXGroupForm()
  const apps = new Map()
  const createApp = (config: FormConfig) => {
    const form = formGroup.create({
      validatorEngine: config.validatorEngine ?? 'zod',
      defaultValidatorEngine: config.defaultValidatorEngine ?? 'zod',
      ...config,
    })
    function resolveComponent(component: string | Component | DefineComponent): Component | DefineComponent {
      if (typeof component === 'string') {
        return config.components[component]
      }
      return component
    }
    if (config.resolvers?.validator) {
      Object.entries(config.resolvers.validator).forEach(([validator, resolver]) => {
        setupValidator(validator, resolver)
      })
    }
    const app = h('div', null, form.graph.map((field) => {
      return h(FieldControl, {
        key: field.path,
        field: field,
        model: form.model,
        resolveComponent
      })
    }))
    return {
      app,
      form
    }
  }
  return {
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
