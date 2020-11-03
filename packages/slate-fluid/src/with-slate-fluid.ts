import { Editor, Operation } from 'slate';
import { BaseFluidModel } from '@solidoc/fluid-model-base';
const uuid = require('uuid').v4();

const withSlateFluid = <T extends Editor, U extends BaseFluidModel<Operation>>(
  editor: T,
  model: U,
) => {
  const { apply, onChange } = editor;

  model.subscribe(ops => {
    Editor.withoutNormalizing(editor, () => {
      ops.forEach(op => {
        op[uuid] = true;
        apply(op);
        console.log('apply op', op);
      });
    });
  });

  editor.onChange = () => {
    const allWasUserActionOps = editor.operations.every(op => !op[uuid]);
    if (allWasUserActionOps) {
      model.apply(editor.operations);
      onChange();
    } else {
      console.log('operation from server', editor.operations);
      onChange();
    }
  };

  return editor;
};
export { withSlateFluid };
