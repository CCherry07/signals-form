interface Plugin {
  name: string;
  install: (ctx: any) => void;
  create: (ctx: any) => void;
  created: (ctx: any) => void;
  destroy: (ctx: any) => void;
  normalizeField: (ctx: any) => void;
  updateProperties: (ctx: any) => void;

  componentMount: (ctx: any) => void;
  componentUnmount: (ctx: any) => void;

  hidden: (ctx: any) => void;
  disabled: (ctx: any) => void;
  eventTrigger: (ctx: any) => void;

  update: (ctx: any) => void;
  submit: (ctx: any) => void;
  reset: (ctx: any) => void;
  validate: (ctx: any) => void;
  resetError: (ctx: any) => void;
}

const definePlugin = (plugin: any) => {
  return plugin
}
