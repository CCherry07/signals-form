import { FieldControl } from "./FieldControl";
import { createRXForm, Field, setupValidator } from "@rxform/core"
import { Resolver } from '@rxform/core/validator/resolvers/type';
import { Component, createVNode, DefineComponent } from "vue";

interface FormConfig {
  components: Record<string, string | Component | DefineComponent>;
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
  const from = createRXForm({
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

  function resolveComponent(component: string | Component | DefineComponent) {
    if (typeof component === 'string') {
      return components[component]
    }
    return component
  }
  const app = createVNode('div', null, graph.map((field) => {
    return createVNode(FieldControl, {
      key: field.path,
      field: field,
      model: from.model,
      resolveComponent: resolveComponent
    })
  }))

  return {
    app,
    from
  }
}

