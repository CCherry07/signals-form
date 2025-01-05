import { FieldControl } from "./FieldControl";
import { createRXForm, Field, setupValidator, createGroupForm as createRXGroupForm, type Resolver } from "@rxform/core"
import { type Component, type DefineComponent, h } from "vue";

interface FormConfig {
  components: Record<string, Component | DefineComponent>;
  graph: typeof Field[];
  defaultValidatorEngine: string;
  boolsConfig: Record<string, (...args: any[]) => boolean>;
  id: string;
  resolvers?: {
    validator?: Record<string, Resolver>
  }
}
export const createForm = (config: FormConfig) => {
  const {
    graph,
    defaultValidatorEngine,
    boolsConfig,
    components,
    resolvers,
    id
  } = config;
  const form = createRXForm({
    id,
    defaultValidatorEngine,
    boolsConfig,
    graph,
  })

  if (resolvers?.validator) {
    Object.entries(resolvers.validator).forEach(([validator, resolver]) => {
      setupValidator.call(form, validator, resolver)
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
      validatorResolvers: form.validatorResolvers,
      defaultValidatorEngine: config.defaultValidatorEngine,
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
  const apps = new Map<string, ReturnType<typeof h>>()
  const createApp = (config: FormConfig) => {
    const form = formGroup.create(config)
    function resolveComponent(component: string | Component | DefineComponent): Component | DefineComponent {
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
    const app = h('div', null, form.graph.map((field) => {
      return h(FieldControl, {
        key: field.path,
        field: field,
        model: form.model,
        validatorResolvers: form.validatorResolvers,
        defaultValidatorEngine: config.defaultValidatorEngine,
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
