import {
  FluidNode,
  FluidNodeChildren,
  FluidNodeChildrenHandle,
  FluidNodeHandle,
  FluidNodeProperty,
  FluidNodePropertyHandle,
} from './types';
import {FLUIDNODE_KEYS} from "./interfaces";
import {SharedObjectSequence} from "@fluidframework/sequence";

const nodeCache: { [key: string]: FluidNode } = {};
const childrenCache: { [key: string]: FluidNodeChildren } = {};
const textCache: { [key: string]: FluidNodeProperty } = {};

const addNodeWithChildrenToCache = async (node: FluidNode) => {
  nodeCache[node.id] = node;
  if (node.has(FLUIDNODE_KEYS.CHILDREN)) {
    const children = await (node.get<FluidNodeChildrenHandle>(FLUIDNODE_KEYS.CHILDREN).get())

    addChildrenToCache(children)

    await Promise.all([...children.getRange(0)].map(async (handle: FluidNodeHandle) => {
      const node = await handle.get()
      await addNodeWithChildrenToCache(node)
    }))
  }
  if (node.has(FLUIDNODE_KEYS.TEXT)) {
    const text = await node.get(FLUIDNODE_KEYS.TEXT).get()
    addTextToCache(text)
  }
};

const addNodeToCache = (node: FluidNode) => {
  nodeCache[node.id] = node;
};

const getNodeFromCache = (absolutePath: string) => {
  const [id] = absolutePath.split('/').reverse();
  let node = nodeCache[id];
  if (!node) {
    throw new Error(`No node cache for ${id}`);
  }
  return node;
};

const addChildrenToCache = (children: FluidNodeChildren) => {
  childrenCache[children.id] = children;
};

const getChildrenFromCache = (absolutePath: string) => {
  const [id] = absolutePath.split('/').reverse();
  let children = childrenCache[id];
  if (!children) {
    throw new Error(`No children cache for ${id}`);
  }
  return children;
};

const addTextToCache = (text: FluidNodeProperty) => {
  textCache[text.id] = text;
};

const getTextFromCache = (absolutePath: string) => {
  const [id] = absolutePath.split('/').reverse();
  let text = textCache[id];
  if (!text) {
    throw new Error(`No text cache for ${id}`);
  }
  return text;
};

const getChildrenFromCacheByHandle = (handle: FluidNodeChildrenHandle) =>
  getChildrenFromCache(handle.absolutePath);
const getNodeFromCacheByHandle = (handle: FluidNodeHandle) =>
  getNodeFromCache(handle.absolutePath);
const getTextFromCacheByHandle = (handle: FluidNodePropertyHandle) =>
  getTextFromCache(handle.absolutePath);

export {
  addNodeToCache,
  getNodeFromCache,
  getNodeFromCacheByHandle,
  addChildrenToCache,
  getChildrenFromCache,
  getChildrenFromCacheByHandle,
  addTextToCache,
  getTextFromCacheByHandle,
  addNodeWithChildrenToCache,
};
