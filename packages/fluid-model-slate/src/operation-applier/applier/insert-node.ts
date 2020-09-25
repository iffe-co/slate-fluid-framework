import { InsertNodeOperation } from 'slate';
import { SharedObjectSequence } from '@fluidframework/sequence';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedMap } from '@fluidframework/map';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import {getChildren, getNode, getParent} from '../node-getter';
import { createNode } from '../element-factory';

const applyInsertNodeOperation = async (
  op: InsertNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => {
  const parent = await getParent(op.path, root);
  const element = createNode(op.node, runtime);
  parent.insert(parent.getLength(), [
    <IFluidHandle<SharedMap>>element.handle,
  ]);
};

export { applyInsertNodeOperation };
