import { FieldErrors } from "../validate/error/field";

export type Model = Record<string, any>;

export interface Context {
  readonly submitted: boolean;
  readonly errors: FieldErrors;
  readonly model: Model;
  validatorEngine: string;
  defaultValidatorEngine: string;
  onSubmit: (model: Model) => void;
  onReset: () => void;
  updateModel: (model: Model) => void;
  setErrors: (errors: FieldErrors) => void;
  setFieldValue: (field: string, value: any) => void;
  getFieldValue: (field: string) => any;
  getFieldError: (field: string) => string | undefined;
  validate: () => Promise<boolean>;
  validateField: (field: string) => Promise<boolean>;
  validateFields: (fields: string[]) => Promise<boolean>;
  validateFieldsAndScroll: (fields: string[]) => Promise<boolean>;
  validateFieldsAndScrollToFirstError: (fields: string[]) => Promise<boolean>;
}

