import { Node } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';
import { SharedMap } from '@fluidframework/map';
import { FLUIDNODE_KEYS } from '../interfaces';
import {IFluidHandle} from "@fluidframework/core-interfaces";

const createText = (text: string, runtime: IFluidDataStoreRuntime) => {
  const shareString = SharedString.create(runtime);
  shareString.insertText(0, text);
  return shareString;
};

const createChildren = (runtime: IFluidDataStoreRuntime, content?: IFluidHandle<SharedMap>[]) => {
  const sequence = SharedObjectSequence.create<IFluidHandle<SharedMap>>(runtime);
  if (content) {
    sequence.insert(0, content);
  }
  return sequence;
};

const createNode = (node: Node, runtime: IFluidDataStoreRuntime) => {
  const element = SharedMap.create(runtime);

  if (node.text) {
    const text = createText(node.text as string, runtime);
    element.set(FLUIDNODE_KEYS.TEXT, text.handle);
  } else {
    const children = createChildren(runtime);
    element.set(FLUIDNODE_KEYS.CHILDREN, children.handle);
  }

  return element;
};

const createNodeWithChildren = (children: IFluidHandle<SharedMap>[], runtime: IFluidDataStoreRuntime) => {
  const element = SharedMap.create(runtime);
  element.set(FLUIDNODE_KEYS.CHILDREN, createChildren(runtime, children).handle);
  return element;
};

export { createNode, createNodeWithChildren };
