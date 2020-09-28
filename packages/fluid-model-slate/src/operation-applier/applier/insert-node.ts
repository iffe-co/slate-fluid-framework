import { InsertNodeOperation } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getParent } from '../node-getter';
import { createNode } from '../element-factory';
import { FluidNodeChildren, FluidNodeHandle } from '../../types';

const applyInsertNodeOperation = async (
  op: InsertNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const parent = await getParent(op.path, root);
  const index = op.path[op.path.length - 1];
  const element = createNode(op.node, runtime);
  parent.insert(index, [<FluidNodeHandle>element.handle]);
};

export { applyInsertNodeOperation };
