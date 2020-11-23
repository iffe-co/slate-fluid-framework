import { RemoveTextOperation } from '@solidoc/slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getNode, getText } from '../node-getter';
import { FluidNodeChildren } from '../../types';

const applyRemoveTextOperation = (
  op: RemoveTextOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = getNode(op.path, root);
  const text = getText(node);
  if (op.offset + op.text.length > op.offset) {
    text.removeText(op.offset, op.offset + op.text.length);
  }
};

export { applyRemoveTextOperation };
