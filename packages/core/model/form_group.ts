import { AbstractModel, Model } from "./abstract_model"

export class FormGroup {
  models: Map<string, Model>;
  form: Map<string, AbstractModel<any>>;
  constructor() {
    this.models = new Map();
    this.form = new Map();
  }

  addControl(id: string, model: Model) {
    this.models.set(id, model);
  }

  removeControl(id: string) {
    this.models.delete(id);
  }

  get(id: string) {
    return this.models.get(id);
  }

  changeModel(id: string) {
    const model = this.get(id);
    this.form.updateModel(model);
  }

  changeForm() {
    
  }
}
