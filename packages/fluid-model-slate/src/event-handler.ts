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
const addEventListenerHandler = async (root: FluidNodeChildren) => {
  fluidNodeChildrenEventBinder(root, root);
  const nodeHandles = root.getRange(0);
  for (let handle of nodeHandles) {
    await addListenerToNode(handle, root);
  }
};

const addListenerToNode = async (
  nodeHandle: FluidNodeHandle,
  root: FluidNodeChildren,
): Promise<void> => {
  const node = await nodeHandle.get();
  bindFluidNodeEvent(node, root);
  if (node.has(FLUIDNODE_KEYS.CHILDREN)) {
    const childrenHandle = <FluidNodeChildrenHandle>(
      node.get(FLUIDNODE_KEYS.CHILDREN)
    );
    const children = await childrenHandle.get();

    fluidNodeChildrenEventBinder(children, root);

    const nodeHandles = children.getRange(0);
    for (let handle of nodeHandles) {
      await addListenerToNode(handle, root);
    }
  }
  if (node.has(FLUIDNODE_KEYS.TEXT)) {
    const textHandle = node.get<FluidNodePropertyHandle>(FLUIDNODE_KEYS.TEXT);
    const text = await textHandle.get();
    fluidNodePropertyEventBinder(text, root);
  }
};

export { addEventListenerHandler };
