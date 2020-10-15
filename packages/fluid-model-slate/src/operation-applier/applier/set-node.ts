import { SetNodeOperation } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getNode } from '../node-getter';
import { FluidNodeChildren } from '../../types';

const applySetNodeOperation = async (
  op: SetNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = await getNode(op.path, root);
  const { newProperties } = op;
  return () => {
    Object.keys(newProperties).forEach(k => {
      node.set(k, newProperties[k]);
    });
  };
};

export { applySetNodeOperation };
