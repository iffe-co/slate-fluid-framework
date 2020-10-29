import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedMap } from '@fluidframework/map';
import { FLUIDNODE_KEYS } from '../interfaces';
import {
  FluidNodeChildren,
  FluidNodeProperty,
  FluidNodePropertyHandle,
} from '../types';
import {
  getChildrenFromCache,
  getChildrenFromCacheByHandle,
  getNodeFromCache,
  getNodeFromCacheByHandle,
  getTextFromCacheByHandle,
} from '../dds-cache';

const getNode = (path: number[], root: FluidNodeChildren): SharedMap => {
  const [index, ...rest] = path;

  if (index === undefined) {
    throw new Error('can not get effective index to get node!');
  }

  if (rest.length === 0) {
    const [targetNode] = root.getRange(index, index + 1);

    if (!targetNode) {
      throw new Error('Target node not exist!');
    }

    return getNodeFromCacheByHandle(targetNode);
  }

  const mapHandle = root.getRange(index, index + 1)[0];
  const map = getNodeFromCache(mapHandle.absolutePath);
  let childrenHandle = map.get(FLUIDNODE_KEYS.CHILDREN);
  let nextChildren = getChildrenFromCache(childrenHandle.absolutePath);
  return getNode(rest, nextChildren);
};

const getChildren = (node: SharedMap): FluidNodeChildren => {
  const childrenHandle = <IFluidHandle<FluidNodeChildren>>(
    node.get(FLUIDNODE_KEYS.CHILDREN)
  );
  return getChildrenFromCacheByHandle(childrenHandle);
};

const getText = (node: SharedMap): FluidNodeProperty => {
  const textHandle = <FluidNodePropertyHandle>node.get(FLUIDNODE_KEYS.TEXT);
  return getTextFromCacheByHandle(textHandle);
};

const getParent = (
  path: number[],
  root: FluidNodeChildren,
): FluidNodeChildren => {
  return path.length === 1
    ? root
    : getChildrenFromCacheByHandle(
        getNode(path.slice(0, -1), root).get(FLUIDNODE_KEYS.CHILDREN),
      );
};

const getPrevious = (path: number[], root: FluidNodeChildren) => {
  if (path.length === 0 || path[path.length - 1] <= 0) {
    throw `Cannot get the previous path of a root path [${path}], because it has no previous index.`;
  }

  const prevPath = [...path.slice(0, -1), path[path.length - 1] - 1];
  return getNode(prevPath, root);
};

export { getNode, getChildren, getText, getParent, getPrevious };
