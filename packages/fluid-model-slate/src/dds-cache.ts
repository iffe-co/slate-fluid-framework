import { FluidNode, FluidNodeChildren, FluidNodeProperty } from './types';

const nodeCache: { [key: string]: FluidNode } = {};
const childrenCache: { [key: string]: FluidNodeChildren } = {};
const textCache: { [key: string]: FluidNodeProperty } = {};

const addNodeToCache = (node: FluidNode) => {
  nodeCache[node.id] = node;
};

const getNodeFromCache = (absolutePath: string) => {
  const [id] = absolutePath.split('/').reverse();
  return nodeCache[id];
};

const addChildrenToCache = (children: FluidNodeChildren) => {
  childrenCache[children.id] = children;
};
const addTextToCache = (text: FluidNodeProperty) => {
  textCache[text.id] = text;
};
export { addNodeToCache, getNodeFromCache, addChildrenToCache, addTextToCache };
