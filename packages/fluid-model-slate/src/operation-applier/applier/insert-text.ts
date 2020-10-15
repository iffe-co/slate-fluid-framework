import { InsertTextOperation } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getNode, getText } from '../node-getter';
import { FluidNodeChildren } from '../../types';

const applyInsertTextOperation = async (
  op: InsertTextOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = await getNode(op.path, root);
  const text = await getText(node);
  return () => {
    text.insertText(op.offset, op.text);
  };
};

export { applyInsertTextOperation };
