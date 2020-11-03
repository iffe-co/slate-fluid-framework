import {getSlateModel} from "../utils/model-getter";
import {getEditor} from "../utils/editor-getter";

// @ts-ignore
Object.defineProperty(window, 'performance', {
    value: undefined,
    writable: false,
});

describe('init editor', function () {
    it.skip('should init editor with slate fluid model', async function () {
        const {model, initValue, id} = await getSlateModel()
        const editor = getEditor(model, initValue)
        expect(initValue).toEqual(editor.children)
    });
});
