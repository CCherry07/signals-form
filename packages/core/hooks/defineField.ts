import { FieldBuilder } from "../builder/field";

interface FieldOptions<T, P extends Record<string, any>> {
  component: Parameters<FieldBuilder<T, P>['component']>[0];
  props?: Parameters<FieldBuilder<T, P>['props']>[0];
  actions?: Parameters<FieldBuilder<T, P>['actions']>[0];
  validator?: FieldBuilder<T, P>['validator'];
  events?: Parameters<FieldBuilder<T, P>['events']>[0];
  lifecycle?: Parameters<FieldBuilder<T, P>['lifecycle']>[0];
  relation?: Parameters<FieldBuilder<T, P>['relation']>[0];
  initialValue?: Parameters<FieldBuilder<T, P>['initialValue']>[0];
}

export const defineField = <T, P extends Record<string, any>>(
  options?: FieldOptions<T, P>
) => {
  const builder = new FieldBuilder<T, P>();
  if (options) {
    const { component, props, actions, validator, events, lifecycle, relation, initialValue } = options;
    if (component) {
      builder.component(component);
    }
    if (initialValue) {
      builder.initialValue(initialValue);
    }
    if (props) {
      builder.props(props);
    }
    if (actions) {
      builder.actions(actions);
    }
    if (validator) {
      builder.validator(validator);
    }
    if (events) {
      builder.events(events);
    }
    if (lifecycle) {
      builder.lifecycle(lifecycle);
    }
    if (relation) {
      builder.relation(relation);
    }
  }
  return builder;
}
