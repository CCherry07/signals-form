// 如何处理表单组的数据

export class FormGroup {
  private controls: { [key: string]: any };

  constructor(controls: { [key: string]: any }) {
    this.controls = controls;
  }

  getControl(name: string): any {
    return this.controls[name];
  }

  setControl(name: string, control: any): void {
    this.controls[name] = control;
  }

  removeControl(name: string): void {
    delete this.controls[name];
  }

  getValue(): { [key: string]: any } {
    const value: { [key: string]: any } = {};
    for (const key in this.controls) {
      if (this.controls.hasOwnProperty(key)) {
        value[key] = this.controls[key].value;
      }
    }
    return value;
  }

  setValue(value: { [key: string]: any }): void {
    for (const key in value) {
      if (value.hasOwnProperty(key) && this.controls[key]) {
        this.controls[key].value = value[key];
      }
    }
  }

  reset(): void {
    for (const key in this.controls) {
      if (this.controls.hasOwnProperty(key)) {
        this.controls[key].reset();
      }
    }
  }
}
