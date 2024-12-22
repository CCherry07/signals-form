import { FieldControl } from "./FieldControl";
import { createRXForm, Field, setupValidator } from "@rxform/core"
import { Resolver } from '@rxform/core/validator/resolvers/type';
import { Component, DefineComponent, h } from "vue";

interface FormConfig {
  components: Record<string, Component | DefineComponent>;
  graph: Field[];
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
  const app = h('div', null, graph.map((field) => {
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

