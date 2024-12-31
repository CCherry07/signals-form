import React, { ComponentClass, FunctionComponent } from 'react';
import { FieldControl } from "./FieldControl";
import { createRXForm, Field, setupValidator, createGroupForm as createRXGroupForm } from "@rxform/core"
import { Resolver } from '@rxform/core/resolvers/type';

interface FormConfig {
  components: Record<string, string | FunctionComponent<any> | ComponentClass<any, any>>;
  graph: (typeof Field)[];
  validatorEngine: string;
  defaultValidatorEngine: string;
  boolsConfig: Record<string, (...args: any[]) => boolean>;
  id: string;
  resolvers?: {
    validator?: Record<string, Resolver>
  }
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

  const app = <div>
    {
      form.graph.map((field) => {
        return <FieldControl
          key={field.path}
          field={field}
          model={form.model}
          defaultValidatorEngine={config.defaultValidatorEngine}
          validatorResolvers={form.validatorResolvers}
          resolveComponent={resolveComponent}
        />
      })
    }
  </div>

  return {
    app,
    form
  }
}


export const createGroupForm = () => {
  const formGroup = createRXGroupForm()
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
    const app = <div>
      {
        form.graph.map((field) => {
          return <FieldControl
            key={field.path}
            field={field}
            model={form.model}
            defaultValidatorEngine={config.defaultValidatorEngine}
            validatorResolvers={form.validatorResolvers}
            resolveComponent={resolveComponent}
          />
        })
      }
    </div>
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
