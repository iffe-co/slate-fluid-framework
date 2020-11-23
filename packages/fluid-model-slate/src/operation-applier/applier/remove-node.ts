import { RemoveNodeOperation } from '@solidoc/slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getParent } from '../node-getter';
import { FluidNodeChildren } from '../../types';

const applyRemoveNodeOperation = (
  op: RemoveNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const { path } = op;
  const parent = getParent(path, root);
  const index = path[path.length - 1];
  parent.remove(index, index + 1);
};

export { applyRemoveNodeOperation };
