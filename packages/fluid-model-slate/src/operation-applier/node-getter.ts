import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedMap } from '@fluidframework/map';
import { FLUIDNODE_KEYS } from '../interfaces';

const getNode = async (
  path: number[],
  children: SharedObjectSequence<IFluidHandle<SharedMap>>,
): Promise<SharedMap> => {
  const [index, ...rest] = path;

  if (index === undefined) {
    throw 'can not get effective index to get node!';
  }

  if (rest.length === 0) {
    return await children.getRange(index, index + 1)[0].get();
  }

  const map = await children.getRange(index, index + 1)[0].get();
  let nextChildren = await map.get(FLUIDNODE_KEYS.CHILDREN).get();
  return await getNode(rest, nextChildren);
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

const getText = async (node: SharedMap): Promise<SharedString> => {
  const textHandle = <IFluidHandle<SharedString>>node.get(FLUIDNODE_KEYS.TEXT);
  const text = await textHandle.get();
  return text;
};

export { getNode, getChildren, getText };
