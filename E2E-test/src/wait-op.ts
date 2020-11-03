import {getSlateModel} from "./utils/model-getter";

getSlateModel('e1490c74-809c-4b54-bd3d-7469b5e97175').then((res) => {
    console.log(JSON.stringify(res.initValue))
    res.model.apply([{ type: 'insert_text', offset:0, path:[0, 0], text:'c' }])
})
