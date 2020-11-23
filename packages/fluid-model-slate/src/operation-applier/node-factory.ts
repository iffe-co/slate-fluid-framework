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
import {
  bindFluidNodeEvent,
  fluidNodeChildrenEventBinder,
  fluidNodePropertyEventBinder,
} from '../dds-event-processor';

const createSharedString = (
  text: string,
  runtime: IFluidDataStoreRuntime,
  root: FluidNodeChildren,
) => {
  const shareString = SharedString.create(runtime);
  shareString.insertText(0, text);
  addTextToCache(shareString);
  fluidNodePropertyEventBinder(shareString, root);
  return shareString;
};

const createChildren = (
  runtime: IFluidDataStoreRuntime,
  root: FluidNodeChildren,
  content?: FluidNodeHandle[],
) => {
  const sequence = SharedObjectSequence.create<FluidNodeHandle>(runtime);
  if (content) {
    sequence.insert(0, content);
  }
  addChildrenToCache(sequence);
  fluidNodeChildrenEventBinder(sequence, root);
  return sequence;
};

function buildChildren(
  runtime: IFluidDataStoreRuntime,
  childrenOp: Node[],
  root: FluidNodeChildren,
) {
  const children = createChildren(runtime, root);
  const childrenHandles = childrenOp.map(
    c => createNode(c, runtime, root).handle,
  );
  children.insert(0, <FluidNodeHandle[]>childrenHandles);
  return children;
}

const createNode = (
  slateNode: Node,
  runtime: IFluidDataStoreRuntime,
  root: FluidNodeChildren,
) => {
  const node = SharedMap.create(runtime);
  addNodeToCache(node);
  bindFluidNodeEvent(node, root);

  if (slateNode.text !== undefined) {
    const text = createSharedString(slateNode.text as string, runtime, root);
    node.set(FLUIDNODE_KEYS.TEXT, text.handle);
  } else if (slateNode.children) {
    const children = buildChildren(runtime, slateNode.children as Node[], root);
    node.set(FLUIDNODE_KEYS.CHILDREN, children.handle);
  } else {
    const children = createChildren(runtime, root);
    node.set(FLUIDNODE_KEYS.CHILDREN, children.handle);
  }

  Object.keys(slateNode)
    .filter(k => k !== 'children' && k !== 'text')
    .forEach(k => {
      node.set(k, slateNode[k]);
    });

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

const createNodeWithChildren = (
  children: FluidNodeHandle[],
  properties: Partial<Element>,
  runtime: IFluidDataStoreRuntime,
  root: FluidNodeChildren,
) => {
  const node = SharedMap.create(runtime);
  addNodeToCache(node);

  node.set(
    FLUIDNODE_KEYS.CHILDREN,
    createChildren(runtime, root, children).handle,
  );
  if (properties) {
    applyProperties<Element>(properties, node, runtime);
  }
  return node;
};

export { createNode, createNodeWithChildren, createSharedString };
