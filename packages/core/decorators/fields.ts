import {isArray, isObject, isString} from "@rxform/shared";
import {effect, effectScope} from "alien-signals";
import {computed} from "alien-deepsignals";
import {useOrCreateMetaData} from "./setMetaData";
import {METADATA_EFFECT} from "./metaKeys"

export function Fields(
    deps?: string | string[] | Record<string, string>,
) {
    return function (method: Function, ctx: ClassMethodDecoratorContext) {
        const meta = useOrCreateMetaData(ctx, METADATA_EFFECT, [])
        meta.push(function (this: any) {
                const values = computed(() => {
                    let injectValues: any = undefined
                    if (isArray(deps)) {
                        injectValues = deps.map((dep: string) => this.deps[dep].value)
                    } else if (isObject(deps)) {
                        injectValues = Object.fromEntries(Object.entries(deps).map(([key, dep]) => {
                            return [key, this.deps[dep as string].value]
                        }))
                    } else if (isString(deps)) {
                        injectValues = this.deps[deps].value
                    }
                    return injectValues
                })
                effect(() => {
                    const s = effectScope()
                    s.run(() => {
                        method.call(this, values.value)
                    })
                    s.stop()
                })
            }
        )
    };
}
