import { Editor } from 'slate';
import { IFluidDraftJsObject } from '../fluid-object';
// import { ddsChangesQueue } from '../slate-fluid-model/dds-changes-queue';
import { ddsChangesQueue } from '@solidoc/fluid-model-slate';
const uuid = require('uuid').v4();

const withSlateFluid = <T extends Editor>(
  editor: T,
  model: IFluidDraftJsObject,
) => {
  const { apply, onChange } = editor;
  ddsChangesQueue.init(
    apply,
    op => {
      op[uuid] = true;
      return op;
    },
    editor,
  );

  editor.onChange = () => {
    let opsFromUserAction = editor.operations.every(op => !op[uuid]);
    if (opsFromUserAction) {
      model.applyOperations(editor.operations);
      onChange();
    } else {
      console.log('not apply ', editor.operations);
    }
  };

  return editor;
};
export { withSlateFluid };
