import { AbstractModel } from "../model/abstract_model"

type Options = ConstructorParameters<typeof AbstractModel>

export function useform(
  id: string,
  options?: Options[1]
) {
  return new AbstractModel(id, options)
}
