import { Editor, Operation } from 'slate';
import { BaseFluidModel } from '@solidoc/fluid-model-base';

function syncApply(ops: Operation[], apply: (op: Operation) => Promise<void>) {
  if (ops.length === 0) {
    return;
  }
  const op = ops.shift() as Operation;
  apply(op).then(() => {
    setTimeout(() => {
      syncApply(ops, apply);
    }, 1000);
  });
}

const withSlateFluid = <T extends Editor, U extends BaseFluidModel<Operation>>(
  editor: T,
  model: U,
) => {
  const { apply, onChange } = editor;
  model.subscribe(op => apply(op));

  editor.onChange = () => {
    syncApply(editor.operations, model.apply);
    onChange();
  };

  return editor;
};
export { withSlateFluid };
