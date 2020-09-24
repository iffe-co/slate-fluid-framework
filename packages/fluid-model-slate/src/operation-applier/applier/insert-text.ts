import { InsertTextOperation } from 'slate';
import { SharedObjectSequence } from '@fluidframework/sequence';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedMap } from '@fluidframework/map';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getNode, getText } from '../node-getter';

const applyInsertTextOperation = async (
  op: InsertTextOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = await getNode(op.path, root);
  const text = await getText(node);
  text.insertText(op.offset, op.text);
};

export { applyInsertTextOperation };
