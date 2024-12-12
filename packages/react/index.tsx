import React, { useMemo } from 'react';
import { FieldControl } from "./FieldControl";
import { createRXForm, Filed } from "@rxform/core"

interface FormConfig {
  components: Record<string, any>;
  graph: Record<string, Filed>;
  validatorEngine: string;
  defaultValidatorEngine: string;
  boolsConfig: Record<string, (...args: any[]) => boolean>;
}
export const createForm = (config: FormConfig) => {
  const {
    graph,
    validatorEngine,
    defaultValidatorEngine,
    boolsConfig
  } = config;
  const from = createRXForm({
    validatorEngine,
    defaultValidatorEngine,
    boolsConfig,
    graph,
  })

  const app = <div>
    {
      Object.entries(graph).map(([key, filed]) => {
        return <FieldControl
          key={key}
          filed={filed} />
      })
    }
  </div>

  return {
    app,
    from
  }
}
