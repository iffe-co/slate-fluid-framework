import {getSlateModel} from "../utils/model-getter";

// @ts-ignore
Object.defineProperty(window, 'performance', {
    value: undefined,
    writable: false,
});

describe('init model', function () {
    it.skip('should get new model when call model getter without id', async function () {
        const {model, initValue, id} = await getSlateModel()
        expect(model).not.toBeNull()
        expect(initValue).toEqual([{"children": [{"text": ""}]}])
    });

    it('should get exist model when call model getter with id', async function () {
        const {id} = await getSlateModel()
        const {model, initValue} = await getSlateModel(id)
        expect(model).not.toBeNull()
        expect(initValue).toEqual([{"children": [{"text": ""}]}])
    });
});
