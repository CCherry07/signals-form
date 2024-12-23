import { AbstractModel, AbstractModelMethods, Model } from "./abstract_model"
import { asyncBindingModel, FormConfig } from "./form"

export class FormGroup {
  form?: AbstractModel<any>;
  forms: Map<string, AbstractModel<any>>;
  constructor() {
    this.forms = new Map();
  }

  create(config: FormConfig<Model>) {
    const form = new AbstractModel(config.id)
    const methods: AbstractModelMethods = {
      setFieldValue: form.setFieldValue.bind(form),
      setErrors: form.setErrors.bind(form),
      setFieldProps: form.setFieldProps.bind(form),
      cleanErrors: form.cleanErrors.bind(form),
      onSubscribe: form.onSubscribe.bind(form)
    }
    const fields = {}
    const model = asyncBindingModel(methods, config.graph!, fields, "")
    form.init({
      ...config,
      model,
      fields
    })
    this.add(config.id, form);
    return this;
  }

  add(id: string, form: AbstractModel<any>) {
    this.forms.set(id, form);
    return this;
  }

  remove(id: string) {
    this.forms.delete(id);
    return this;
  }

  get(id: string) {
    return this.forms.get(id);
  }

  use(id: string) {
    const form = this.forms.get(id);
    if (!form) {
      throw new Error("form is not defined")
    }
    this.form = form;
    return this;
  }
}

let formGroup: FormGroup | undefined;
export function createGroupForm() {
  if (formGroup) {
    return formGroup
  }
  formGroup = new FormGroup()
  return formGroup
}
