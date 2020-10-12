import { MoveNodeOperation } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getNode, getParent } from '../node-getter';
import { FluidNodeChildren, FluidNodeHandle } from '../../types';
import { Path } from '../../types/path';

const transformToTruePath = (originPath: number[], targetPath: number[]) => {
  if (Path.equals(originPath, targetPath)) {
    return targetPath;
  }
  const copy = targetPath.slice();

  if (
    Path.endsBefore(originPath, targetPath) &&
    originPath.length < targetPath.length
  ) {
    copy[originPath.length - 1] -= 1;
  }

  return copy;
};

const applyMoveNodeOperation = async (
  op: MoveNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const { path, newPath: targetPath } = op;
  const node = await getNode(path, root);
  const parent = await getParent(path, root);
  const index = path[path.length - 1];
  parent.remove(index, index + 1);

  const truePath = transformToTruePath(path, targetPath);
  const targetParent = await getParent(truePath, root);
  const targetIndex = truePath[truePath.length - 1];
  targetParent.insert(targetIndex, [<FluidNodeHandle>node.handle]);
};

export { applyMoveNodeOperation };
