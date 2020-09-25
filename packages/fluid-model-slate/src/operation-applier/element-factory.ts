import { Node } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { SharedObjectSequence } from '@fluidframework/sequence';
import { SharedMap } from '@fluidframework/map';
import {FLUIDNODE_KEYS} from "../interfaces";

const create = (node: Node, runtime: IFluidDataStoreRuntime) => {
  const element = SharedMap.create(runtime);
  const children = SharedObjectSequence.create(runtime);
  element.set(FLUIDNODE_KEYS.TEXT, node.text);
  element.set(FLUIDNODE_KEYS.CHILDREN, children.handle);
  return element;
};

export { create };
