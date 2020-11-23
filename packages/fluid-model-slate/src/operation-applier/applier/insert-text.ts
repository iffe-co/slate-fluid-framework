import { InsertTextOperation } from '@solidoc/slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getNode, getText } from '../node-getter';
import { FluidNodeChildren } from '../../types';

const applyInsertTextOperation = (
  op: InsertTextOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = getNode(op.path, root);
  const text = getText(node);
  text.insertText(op.offset, op.text);
};

export { applyInsertTextOperation };
