import { InsertNodeOperation } from '@solidoc/slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getParent } from '../node-getter';
import { createNodeNeo } from '../node-factory-neo';
import { FluidNodeChildren, FluidNodeHandle } from '../../types';

const applyInsertNodeOperation = (
  op: InsertNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const parent = getParent(op.path, root);
  const index = op.path[op.path.length - 1];
  const node = createNodeNeo(op.node, runtime, root);
  parent.insert(index, [<FluidNodeHandle>node.handle]);
};

export { applyInsertNodeOperation };
