Object.defineProperty(window, 'performance', {
    value: undefined,
    writable: false,
});

import {getEditor} from "./utils/editor-getter";
import {getSlateModel} from "./utils/model-getter";

describe('init editor', function () {
    it('should init editor with slate fluid model', async function () {
        const {model, initValue, id} = await getSlateModel()
        const editor = getEditor(model, initValue)
        expect(initValue).toEqual(editor.children)
    });
});
