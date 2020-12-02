import { SharedString } from '@fluidframework/sequence';
import { FluidNodeChildren } from './../types';
import { FLUIDNODE_KEYS } from './../interfaces';

import { SharedMap } from '@fluidframework/map';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { getNodeFromCacheByHandle } from './../dds-cache';
import {
  getChildrenFromCacheByHandle,
  getTextFromCacheByHandle,
} from '../dds-cache';

const propertyProcessor = {
  text: (handle: IFluidHandle<SharedString>) =>
    getTextFromCacheByHandle(handle).getText(),
  children: (handle: IFluidHandle<FluidNodeChildren>) => {
    let children = getChildrenFromCacheByHandle(handle);
    return children.getItems(0, children.getLength()).map(nodeHandle => {
      const node = getNodeFromCacheByHandle(nodeHandle);
      return ddsToSlateNode(node);
    });
  },
};

function ddsToSlateNode(node: SharedMap) {
  const op = {};
  for (let key of node.keys()) {
    if (key === FLUIDNODE_KEYS.TEXT || key === FLUIDNODE_KEYS.CHILDREN) {
      op[key] = propertyProcessor[key](node.get(key));
    } else {
      op[key] = node.get(key);
    }
  }
  return op;
}

export { ddsToSlateNode };
