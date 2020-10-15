import { InsertNodeOperation } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getParent } from '../node-getter';
import { createNode } from '../node-factory';
import { FluidNodeChildren, FluidNodeHandle } from '../../types';

const applyInsertNodeOperation = async (
  op: InsertNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const parent = await getParent(op.path, root);
  return () => {
    const index = op.path[op.path.length - 1];
    const node = createNode(op.node, runtime);
    parent.insert(index, [<FluidNodeHandle>node.handle]);
  };
};

export { applyInsertNodeOperation };
