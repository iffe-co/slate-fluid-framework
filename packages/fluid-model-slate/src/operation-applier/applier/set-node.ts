import { SetNodeOperation } from '@solidoc/slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getNode } from '../node-getter';
import { FluidNodeChildren } from '../../types';

const applySetNodeOperation = (
  op: SetNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = getNode(op.path, root);
  const { newProperties } = op;
  Object.keys(newProperties).forEach(k => {
    node.set(k, newProperties[k]);
  });
};

export { applySetNodeOperation };
