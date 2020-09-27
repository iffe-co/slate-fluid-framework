import { Editor, Operation } from 'slate';
import { BaseFluidModel } from '@solidoc/fluid-model-base';

const withSlateFluid = <T extends Editor, U extends BaseFluidModel<Operation>>(
  editor: T,
  model: U,
) => {
  const { /*apply,*/ onChange } = editor;

  editor.onChange = () => {
    console.log(editor.operations);
    // model.apply(op as any);
    editor.operations.forEach(op => {
      // model.apply(op as any);
      console.log(op);
    });
    onChange();
  };

  // model.subscribe('id');
  return editor;
};
export { withSlateFluid };
