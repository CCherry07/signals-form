import { signal } from "alien-signals"
import { createRXForm, FormConfig, normalizeSignal } from "@rxform/core"
import { describe, it,expect } from "vitest"

type Model = Record<string, any>
describe('createRXForm', () => {
  const model = signal({
    userinfo: signal({
      name: signal("cherry")
    })
  })
  const bools = {
    isA: (model: any) => normalizeSignal("userinfo.name", model).value === "cherry"
  }
  // const boolsConfig = setup(bools, model)
  const config: FormConfig<Model> = {
    id: "form",
    defaultValidatorEngine: "zod",
    boolsConfig:bools,
    model,
  }
  it('create form is success', () => {
    const form = createRXForm(config)
    expect(form.addModel)
  })
})

