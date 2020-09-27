import { Node } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';
import { SharedMap } from '@fluidframework/map';
import { FLUIDNODE_KEYS } from '../interfaces';
import { FluidNodeHandle } from '../types';

const createSharedString = (text: string, runtime: IFluidDataStoreRuntime) => {
  const shareString = SharedString.create(runtime);
  shareString.insertText(0, text);
  return shareString;
};

const createChildren = (
  runtime: IFluidDataStoreRuntime,
  content?: FluidNodeHandle[],
) => {
  const sequence = SharedObjectSequence.create<FluidNodeHandle>(runtime);
  if (content) {
    sequence.insert(0, content);
  }
  return sequence;
};

const createNode = (slateNode: Node, runtime: IFluidDataStoreRuntime) => {
  const node = SharedMap.create(runtime);

  if (slateNode.text) {
    const text = createSharedString(slateNode.text as string, runtime);
    node.set(FLUIDNODE_KEYS.TEXT, text.handle);
  } else {
    const children = createChildren(runtime);
    node.set(FLUIDNODE_KEYS.CHILDREN, children.handle);
  }

  if (slateNode.properties) {
    const properties = slateNode.text
      ? (slateNode.properties as Partial<Text>)
      : (slateNode.properties as Partial<Element>);
    for (let key in properties) {
      const property = createSharedString(properties[key], runtime);
      node.set(key, property.handle);
    }
  }

  return node;
};

const applyProperties = <T extends Text | Element>(
  properties: Partial<T>,
  node: SharedMap,
  runtime: IFluidDataStoreRuntime,
) => {
  Object.keys(properties).forEach(k => {
    const property = createSharedString(properties[k], runtime);
    node.set(k, property.handle);
  });
};

const createNodeWithChildren = (
  children: FluidNodeHandle[],
  properties: Partial<Element>,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = SharedMap.create(runtime);
  node.set(FLUIDNODE_KEYS.CHILDREN, createChildren(runtime, children).handle);
  if (properties) {
    applyProperties<Element>(properties, node, runtime);
  }
  return node;
};

export { createNode, createNodeWithChildren };
