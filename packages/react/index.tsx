import React, { ComponentClass, FunctionComponent } from 'react';
import { FieldControl } from "./FieldControl";
import { createRXForm, Field, setupValidator } from "@rxform/core"
import { Resolver } from '@rxform/core/validator/resolvers/type';

interface FormConfig {
  components: Record<string, string | FunctionComponent<any> | ComponentClass<any, any>>;
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

  function resolveComponent(component: string | FunctionComponent<any> | ComponentClass<any, any>) {
    if (typeof component === 'string') {
      return components[component]
    }
    return component
  }

  const app = <div>
    {
      graph.map((field) => {
        return <FieldControl
          key={field.path}
          field={field}
          model={from.model}
          resolveComponent={resolveComponent}
        />
      })
    }
  </div>

  return {
    app,
    from
  }
}
