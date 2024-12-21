import React, { ComponentClass, FunctionComponent } from 'react';
import { FieldControl } from "./FieldControl";
import { createRXForm, Field , setupValidator } from "@rxform/core"
import { Resolver } from '@rxform/core/validator/resolvers/type';

interface FormConfig {
  components: Record<string, string | FunctionComponent<any> | ComponentClass<any, any>>;
  graph: Record<string, Field>;
  validatorEngine: string;
  defaultValidatorEngine: string;
  boolsConfig: Record<string, (...args: any[]) => boolean>;
  /**
   * @default async
   */
  initMode: 'async' | 'sync';
  resolvers?: {
    validator?: Record<string, Resolver>
  }
}
export const createForm = (config: FormConfig) => {
  const {
    graph,
    validatorEngine,
    defaultValidatorEngine,
    boolsConfig,
    components,
    resolvers,
    initMode = 'async'
  } = config;
  const from = createRXForm({
    validatorEngine,
    defaultValidatorEngine,
    boolsConfig,
    graph,
    initMode
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
      Object.entries(graph).map(([key, field]) => {
        return <FieldControl
          key={key}
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
