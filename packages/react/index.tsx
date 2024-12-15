import React, { ComponentClass, FunctionComponent } from 'react';
import { FieldControl } from "./FieldControl";
import { createRXForm, Field } from "@rxform/core"

interface FormConfig {
  components: Record<string, string | FunctionComponent<any> | ComponentClass<any, any>>;
  graph: Record<string, Field>;
  validatorEngine: string;
  defaultValidatorEngine: string;
  boolsConfig: Record<string, (...args: any[]) => boolean>;
}
export const createForm = (config: FormConfig) => {
  const {
    graph,
    validatorEngine,
    defaultValidatorEngine,
    boolsConfig,
    components
  } = config;
  const from = createRXForm({
    validatorEngine,
    defaultValidatorEngine,
    boolsConfig,
    graph,
  })

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
          bools={from.bools}
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
