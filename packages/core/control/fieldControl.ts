import { Decision } from "../boolless"
import { Step } from "../stream";
import { FieldError, ValidateItem } from "../validate"
export interface FieldControl<T> {
  readonly value: T;
  readonly id: string;
  error: FieldError | undefined;
  disabled: Decision;
  display: Decision;


  componentConfig: {
    id: string;
    component: string;
    display: Decision;
    disabled: Decision;
    validate: {
      initiative: {
        all: ValidateItem[]
      }
      signal: {
        all: ValidateItem[]
      }
    }
  }

  signal: Record<string, Step[]>;
  events: Record<string, Step[]>
}
