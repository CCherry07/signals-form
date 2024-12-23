import { Field } from "../controls/field";
import { Resolver } from "../validator/resolvers/type";
import { AbstractModel, AbstractModelMethods } from "./abstract_model"
import { asyncBindingModel } from "./form"

interface FormConfig {
  graph: Field[];
  validatorEngine: string;
  defaultValidatorEngine: string;
  boolsConfig: Record<string, (...args: any[]) => boolean>;
  id: string;
  resolvers?: {
    validator?: Record<string, Resolver>
  }
}
export class FormGroup {
  form?: AbstractModel<any>;
  forms: Map<string, AbstractModel<any>>;
  constructor() {
    this.forms = new Map();
  }

  create(config: FormConfig) {
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
    return form;
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
}

let formGroup: FormGroup | undefined;
export function createGroupForm() {
  if (formGroup) {
    return formGroup
  }
  formGroup = new FormGroup()
  return formGroup
}
