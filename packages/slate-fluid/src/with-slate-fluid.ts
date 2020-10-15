import { Editor, Operation } from 'slate';
import { BaseFluidModel } from '@solidoc/fluid-model-base';
const uuid = require('uuid').v4();

const withSlateFluid = <T extends Editor, U extends BaseFluidModel<Operation>>(
  editor: T,
  model: U,
) => {
  const { apply, onChange } = editor;
  model.subscribe(op => {
    op[uuid] = true;

    apply(op);
  });

  editor.onChange = () => {
    let opsFromUserAction = editor.operations.filter(op => !op[uuid]);
    if (opsFromUserAction.length !== 0) {
      model.apply(opsFromUserAction);
      onChange();
    } else {
      console.log(editor.operations);
    }
  };

  return editor;
};
export { withSlateFluid };
