import { RemoveTextOperation } from 'slate';
import { SharedObjectSequence } from '@fluidframework/sequence';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedMap } from '@fluidframework/map';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getNode, getText } from '../node-getter';

const applyRemoveTextOperation = async (
  op: RemoveTextOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = await getNode(op.path, root);
  const text = await getText(node);
  text.removeText(op.offset, op.offset + op.text.length);
};

export { applyRemoveTextOperation };
