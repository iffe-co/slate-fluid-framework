import {withSlateFluid} from "@solidoc/slate-fluid/src";
import {createEditor} from "slate";
import {SlateFluidModel} from "@solidoc/fluid-model-slate";

export function getEditor(model: SlateFluidModel, initValue: any) {
    const editor = withSlateFluid(createEditor(), model)
    editor.children = initValue
    return editor
}
