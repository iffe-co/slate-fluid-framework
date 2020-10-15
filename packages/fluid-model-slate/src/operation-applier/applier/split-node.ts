import { SplitNodeOperation } from 'slate';
import { SharedMap } from '@fluidframework/map';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { getChildren, getNode, getParent, getText } from '../node-getter';
import { createNode, createNodeWithChildren } from '../node-factory';
import { FLUIDNODE_KEYS } from '../../interfaces';
import { FluidNodeChildren, FluidNodeHandle } from '../../types';

function addNewNodeIntoParent(
  newNode: SharedMap,
  path: number[],
  parent: FluidNodeChildren,
) {
  const [index] = path.slice(-1);
  parent.insert(index + 1, [<FluidNodeHandle>newNode.handle]);
}

const applySplitNodeOperation = async (
  op: SplitNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = await getNode(op.path, root);
  const parent = await getParent(op.path, root);

  if (node.has(FLUIDNODE_KEYS.TEXT)) {
    const text = await getText(node);
    const originText = text.getText();
    const after = originText.slice(op.position);
    return () => {
      text.removeText(op.position, originText.length);
      const newNode = createNode({ text: after, ...op.properties }, runtime);
      addNewNodeIntoParent(newNode, op.path, parent);
    };
  } else {
    const children = await getChildren(node);
    const after = children.getRange(op.position);
    return () => {
      const newNode = createNodeWithChildren(
        after,
        op.properties as Partial<Element>,
        runtime,
      );
      addNewNodeIntoParent(newNode, op.path, parent);
      children.remove(op.position, children.getLength());
    };
  }
};

export { applySplitNodeOperation };
