import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedMap } from '@fluidframework/map';
import { FLUIDNODE_KEYS } from '../interfaces';
import {
  FluidNodeChildren,
  FluidNodeProperty,
  FluidNodePropertyHandle,
} from '../types';

const getNode = async (
  path: number[],
  root: FluidNodeChildren,
): Promise<SharedMap> => {
  const [index, ...rest] = path;

  if (index === undefined) {
    throw new Error('can not get effective index to get node!');
  }

  if (rest.length === 0) {
    const [targetNode] = root.getRange(index, index + 1);

    if (!targetNode) {
      throw new Error('Target node not exist!')
    }

    return await targetNode.get();
  }

  const map = await root.getRange(index, index + 1)[0].get();
  let nextChildren = await map.get(FLUIDNODE_KEYS.CHILDREN).get();
  return await getNode(rest, nextChildren);
};

const getChildren = async (node: SharedMap): Promise<FluidNodeChildren> => {
  const childrenHandle = <IFluidHandle<FluidNodeChildren>>(
    node.get(FLUIDNODE_KEYS.CHILDREN)
  );
  const children = await childrenHandle.get();
  return children;
};

const getText = async (node: SharedMap): Promise<FluidNodeProperty> => {
  const textHandle = <FluidNodePropertyHandle>node.get(FLUIDNODE_KEYS.TEXT);
  const text = await textHandle.get();
  return text;
};

const getParent = async (
  path: number[],
  root: FluidNodeChildren,
): Promise<FluidNodeChildren> => {
  return path.length === 1
    ? root
    : (await getNode(path.slice(0, -1), root))
        .get(FLUIDNODE_KEYS.CHILDREN)
        .get();
};

const getPrevious = async (path: number[], root: FluidNodeChildren) => {
  if (path.length === 0 || path[path.length - 1] <= 0) {
    throw `Cannot get the previous path of a root path [${path}], because it has no previous index.`;
  }

  const prevPath = [...path.slice(0, -1), path[path.length - 1] - 1];
  return await getNode(prevPath, root);
};

export { getNode, getChildren, getText, getParent, getPrevious };
