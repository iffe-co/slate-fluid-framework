import { SetNodeOperation } from 'slate';
import { SharedMap } from '@fluidframework/map';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getNode } from '../node-getter';
import { FluidNodeChildren, FluidNodeHandle } from '../../types';

function addNewNodeIntoParent(
  newNode: SharedMap,
  path: number[],
  parent: FluidNodeChildren,
) {
  const [index] = path.slice(-1);
  parent.insert(index + 1, [<FluidNodeHandle>newNode.handle]);
}

const applySetNodeOperation = async (
  op: SetNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = await getNode(op.path, root);
  const { newProperties } = op;
  Object.keys(newProperties).forEach(k => {
    node.set(k, newProperties[k]);
  });
};

export { applySetNodeOperation };
