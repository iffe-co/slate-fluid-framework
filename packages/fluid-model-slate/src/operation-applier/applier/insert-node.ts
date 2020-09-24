import { InsertNodeOperation } from 'slate';
import { SharedObjectSequence } from '@fluidframework/sequence';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedMap } from '@fluidframework/map';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getChildren, getNode } from '../node-getter';
import { create } from '../element-factory';

const applyInsertNodeOperation = async (
  op: InsertNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = await getNode(op.path, root);
  const element = create(op.node, runtime);
  const children = await getChildren(node);
  children.insert(children.getLength(), [
    <IFluidHandle<SharedMap>>element.handle,
  ]);
};

export { applyInsertNodeOperation };
