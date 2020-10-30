Object.defineProperty(window, 'performance', {
    value: undefined,
    writable: false,
});

import {Editor, Operation} from "slate";
import {getEditor} from "./utils/editor-getter";
import {getSlateModel} from "./utils/model-getter";
import {ddsChangesQueue} from "@solidoc/fluid-model-slate";
import {v4} from "uuid"

describe('editor collaborate', function () {
    let editorA: Editor;
    let editorB: Editor;
    const uuid = v4()
    const applyOpsToEditorAPromise = () => applyOpsToEditorPromise(editorA)
    const applyOpsToEditorBPromise = () => applyOpsToEditorPromise(editorB)
    const applyOpsToEditorPromise = async (editor: Editor) => {
        return new Promise(resolve => {
            ddsChangesQueue.init((ops) => Editor.withoutNormalizing(editor, () => {
                ops.forEach(op => {
                    op[uuid] = true;
                    editor.apply(op);
                    console.log('apply op', op);
                });
                if (ops.length !== 0) {
                    resolve()
                }
            }))
        })
    }

    beforeAll(async () => {
        ddsChangesQueue.init(() => {})
        const {model: modelA, initValue:initValueA, id} = await getSlateModel()
        const {model: modelB, initValue:initValueB,} = await getSlateModel(id)
        editorA = getEditor(modelA, initValueA)
        editorB = getEditor(modelB, initValueB)

    })
    it('should init editor with slate fluid model', async function () {
        const insertTextOp = { type: 'insert_text', offset:0, path:[0, 0], text:'a' } as Operation
        const editorBReceivedOpsPromise = applyOpsToEditorBPromise()
        editorA.apply(insertTextOp)
        await editorBReceivedOpsPromise
        console.log(editorA.children, editorB.children)
        expect(editorA.children).toEqual(editorB.children)
    });
});
