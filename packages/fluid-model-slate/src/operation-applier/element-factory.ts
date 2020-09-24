import { Node } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { SharedObjectSequence } from '@fluidframework/sequence';
import { SharedMap } from '@fluidframework/map';

const create = (node: Node, runtime: IFluidDataStoreRuntime) => {
  const element = SharedMap.create(runtime);
  const children = SharedObjectSequence.create(runtime);
  element.set('text', node.text);
  element.set('children', children);
  return element;
};

export { create };
