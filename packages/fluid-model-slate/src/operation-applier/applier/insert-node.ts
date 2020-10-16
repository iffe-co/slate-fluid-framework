import { InsertNodeOperation } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getParent } from '../node-getter';
import { createNode } from '../node-factory';
import { FluidNodeChildren, FluidNodeHandle } from '../../types';

const applyInsertNodeOperation = (
  op: InsertNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const parent = getParent(op.path, root);
  const index = op.path[op.path.length - 1];
  const node = createNode(op.node, runtime);
  parent.insert(index, [<FluidNodeHandle>node.handle]);
};

export { applyInsertNodeOperation };
