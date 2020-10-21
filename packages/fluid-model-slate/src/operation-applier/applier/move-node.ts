import { MoveNodeOperation } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getNode, getParent } from '../node-getter';
import { FluidNodeChildren, FluidNodeHandle } from '../../types';

const applyMoveNodeOperation = (
  op: MoveNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const { path, newPath: targetPath } = op;
  const node = getNode(path, root);
  const parent = getParent(path, root);
  const index = path[path.length - 1];
  const targetParent = getParent(targetPath, root);
  const targetIndex = targetPath[targetPath.length - 1];
  parent.remove(index, index + 1);
  targetParent.insert(targetIndex, [<FluidNodeHandle>node.handle]);
};

export { applyMoveNodeOperation };
