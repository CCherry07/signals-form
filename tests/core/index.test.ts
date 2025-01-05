export function DispatchData(name: string): Function {
  console.log('DispatchData', name);
  return function (target: any, key: string | symbol) {    
    let value = target[key];
    Object.defineProperty(target, key, {
      enumerable: true,
      configurable: true,
      get() {
        return value;
      },
      set(newValue) {
        console.log('set', newValue);
        value = newValue;
      }
    });
  };
}
class Persion {
  @DispatchData("name")
  name: string|undefined
  constructor(age) {
    this.age = age
  }
  say() {
    console.log(`my name is ${this.name}`);
  }
}

const p = new Persion(18);

p.name = "cherry";
