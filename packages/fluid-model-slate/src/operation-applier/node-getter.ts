import { SharedObjectSequence } from '@fluidframework/sequence';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedMap } from '@fluidframework/map';
import { FLUIDNODE_KEYS } from '../interfaces';

const getNode = async (
  path: number[],
  children: SharedObjectSequence<IFluidHandle<SharedMap>>,
): Promise<SharedMap> => {
  const [index, ...rest] = path;

  if (!index) {
    throw 'can not get effective index to get node!';
  }

  if (rest.length === 0) {
    return await children.getRange(index, index + 1)[0].get();
  }

  const map = await children.getRange(index, index + 1)[0].get();
  return await getNode(rest, map.get('children'));
};

const getChildren = async (
  node: SharedMap,
): Promise<SharedObjectSequence<IFluidHandle<SharedMap>>> => {
  const childrenHandle = <
    IFluidHandle<SharedObjectSequence<IFluidHandle<SharedMap>>>
  >node.get(FLUIDNODE_KEYS.CHILDREN);
  const children = await childrenHandle.get();
  return children;
};

export { getNode, getChildren };
