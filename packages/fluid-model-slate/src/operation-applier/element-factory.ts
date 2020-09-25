import { Node } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';
import { SharedMap } from '@fluidframework/map';
import { FLUIDNODE_KEYS } from '../interfaces';

const createText = (text: string, runtime: IFluidDataStoreRuntime) => {
  const shareString = SharedString.create(runtime);
  shareString.insertText(0, text);
  return shareString;
};

const createChildren = (runtime: IFluidDataStoreRuntime) => {
  return SharedObjectSequence.create(runtime);
};

const create = (node: Node, runtime: IFluidDataStoreRuntime) => {
  const element = SharedMap.create(runtime);

  const children = createChildren(runtime);
  const text = createText(node.text as string, runtime);

  element.set(FLUIDNODE_KEYS.TEXT, text.handle);
  element.set(FLUIDNODE_KEYS.CHILDREN, children.handle);

  return element;
};

export { create };
