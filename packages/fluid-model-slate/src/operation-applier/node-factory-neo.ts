import { Node } from '@solidoc/slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';
import { SharedMap } from '@fluidframework/map';
import { FLUIDNODE_KEYS } from '../interfaces';
import { FluidNodeChildren, FluidNodeHandle } from '../types';
import {
  addChildrenToCache,
  addNodeToCache,
  addTextToCache,
} from '../dds-cache';
import { IFluidHandle } from '@fluidframework/core-interfaces';

const createSharedString = (
  text: string,
  runtime: IFluidDataStoreRuntime,
  root: FluidNodeChildren,
) => {
  const shareString = SharedString.create(runtime);
  shareString.insertText(0, text);
  addTextToCache(shareString);
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
  addChildrenToCache(sequence);
  return sequence;
};

function buildChildren(
  runtime: IFluidDataStoreRuntime,
  childrenOp: Node[],
  root: FluidNodeChildren,
) {
  const children = createChildren(runtime);
  const childrenHandles = childrenOp.map(
    c => createNodeInternal(c, runtime, root).handle,
  );
  children.insert(0, <FluidNodeHandle[]>childrenHandles);
  return children;
}

const createNodeInternal = (
  slateNode: Node,
  runtime: IFluidDataStoreRuntime,
  root: FluidNodeChildren,
) => {
  const node = SharedMap.create(runtime);
  addNodeToCache(node);

  if (slateNode.text !== undefined) {
    const text = createSharedString(slateNode.text as string, runtime, root);
    node.set(FLUIDNODE_KEYS.TEXT, text.handle);
  } else if (slateNode.children) {
    const children = buildChildren(runtime, slateNode.children as Node[], root);
    node.set(FLUIDNODE_KEYS.CHILDREN, children.handle);
  } else {
    const children = createChildren(runtime);
    node.set(FLUIDNODE_KEYS.CHILDREN, children.handle);
  }

  Object.keys(slateNode)
    .filter(k => k !== 'children' && k !== 'text')
    .forEach(k => {
      node.set(k, slateNode[k]);
    });

  return node;
};

const createNodeNeo = (
  slateNode: Node,
  runtime: IFluidDataStoreRuntime,
  root: FluidNodeChildren,
) => {
  // do not bind event listener, will bind on apply end
  const node = createNodeInternal(slateNode, runtime, root);
  return node;
};

const applyProperties = <T extends Text | Element>(
  properties: Partial<T>,
  node: SharedMap,
  runtime: IFluidDataStoreRuntime,
) => {
  Object.keys(properties).forEach(k => {
    node.set(k, properties[k]);
  });
};

const createNodeWithChildrenNeo = (
  children: FluidNodeHandle[],
  properties: Partial<Element>,
  runtime: IFluidDataStoreRuntime,
  root: FluidNodeChildren,
) => {
  const node = SharedMap.create(runtime);
  addNodeToCache(node);

  node.set(FLUIDNODE_KEYS.CHILDREN, createChildren(runtime, children).handle);

  if (properties) {
    applyProperties<Element>(properties, node, runtime);
  }

  return node;
};

export { createNodeNeo, createNodeWithChildrenNeo };
