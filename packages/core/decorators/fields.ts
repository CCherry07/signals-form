import { isPromise } from "@rxform/shared";
import { effect } from "alien-signals";
import { computed } from "alien-deepsignals";
import { useOrCreateMetaData } from "./setMetaData";
import { METADATA_EFFECT } from "./metaKeys"
import { Field } from "../controls/field";

export function Fields(
    deps?: string | string[] | Record<string, string>,
) {
    return function (method: Function, ctx: ClassMethodDecoratorContext) {
        const meta = useOrCreateMetaData(ctx, METADATA_EFFECT, [])
        meta.push(function (this: Field) {
            const values = computed(() => {
                return this.getDepsValue(deps)
            })
            const isUpdating = computed(() => this.getDepsCombinedUpdating(deps))
            effect(() => {
                if (isUpdating.value) {
                    return
                }
                const maybePromise = method.call(this, values.value)
                if (isPromise(maybePromise)) {
                    maybePromise.then(() => {
                        this.isUpdating = false
                    })
                } else {
                    this.isUpdating = false
                }
            })
        })
    }
}
