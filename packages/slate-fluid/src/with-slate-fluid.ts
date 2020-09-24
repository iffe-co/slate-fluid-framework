import { Editor, Operation } from 'slate';
import { BaseFluidModel } from '@solidoc/fluid-model-base';

const withSlateFluid = <T extends Editor, U extends BaseFluidModel>(
  editor: T,
  model: U,
) => {
  const { apply } = editor;

  editor.apply = (op: Operation) => {
    console.log(op);
    // model.apply(op as any);
    apply(op);
  };

  // model.subscribe('id');
  return editor;
};
export { withSlateFluid };
