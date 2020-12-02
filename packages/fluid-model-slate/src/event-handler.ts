import {
  FluidNodeChildren,
  FluidNodeChildrenHandle,
  FluidNodeHandle,
  FluidNodePropertyHandle,
} from './types';
import {
  bindFluidNodeEvent,
  fluidNodeChildrenEventBinder,
  fluidNodePropertyEventBinder,
} from './dds-event-processor';
import { FLUIDNODE_KEYS } from './interfaces';
import {
  getChildrenFromCacheByHandle,
  getNodeFromCacheByHandle,
  getTextFromCacheByHandle,
} from './dds-cache';
const addEventListenerHandler = (root: FluidNodeChildren) => {
  fluidNodeChildrenEventBinder(root, root);
  const nodeHandles = root.getRange(0);
  for (let handle of nodeHandles) {
    addListenerToNode(handle, root);
  }
};

const addListenerToNode = (
  nodeHandle: FluidNodeHandle,
  root: FluidNodeChildren,
) => {
  const node = getNodeFromCacheByHandle(nodeHandle);
  bindFluidNodeEvent(node, root);
  if (node.has(FLUIDNODE_KEYS.CHILDREN)) {
    const childrenHandle = <FluidNodeChildrenHandle>(
      node.get(FLUIDNODE_KEYS.CHILDREN)
    );
    const children = getChildrenFromCacheByHandle(childrenHandle);

    fluidNodeChildrenEventBinder(children, root);

    const nodeHandles = children.getRange(0);
    for (let handle of nodeHandles) {
      addListenerToNode(handle, root);
    }
  }
  if (node.has(FLUIDNODE_KEYS.TEXT)) {
    const textHandle = node.get<FluidNodePropertyHandle>(FLUIDNODE_KEYS.TEXT);
    const text = getTextFromCacheByHandle(textHandle);
    fluidNodePropertyEventBinder(text, root);
  }
};

export { addEventListenerHandler, addListenerToNode };
