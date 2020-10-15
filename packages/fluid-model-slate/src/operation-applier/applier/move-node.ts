import { MoveNodeOperation } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getNode, getParent } from '../node-getter';
import { FluidNodeChildren, FluidNodeHandle } from '../../types';
import { Path } from '../../types/path';

const applyMoveNodeOperation = async (
  op: MoveNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const { path, newPath: targetPath } = op;
  const node = await getNode(path, root);
  const parent = await getParent(path, root);
  const index = path[path.length - 1];
  const targetParent = await getParent(targetPath, root);
  const targetIndex = targetPath[targetPath.length - 1];
  return () => {
    parent.remove(index, index + 1);
    targetParent.insert(targetIndex, [<FluidNodeHandle>node.handle]);
  };
};

export { applyMoveNodeOperation };
