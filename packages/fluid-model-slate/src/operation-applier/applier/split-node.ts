import { SplitNodeOperation } from '@solidoc/slate';
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

const applySplitNodeOperation = (
  op: SplitNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = getNode(op.path, root);
  const parent = getParent(op.path, root);

  if (node.has(FLUIDNODE_KEYS.TEXT)) {
    const text = getText(node);
    const originText = text.getText();
    const after = originText.slice(op.position);
    if (originText.length > op.position) {
      text.removeText(op.position, originText.length);
    }
    const newNode = createNode(
      { text: after, ...op.properties },
      runtime,
      root,
    );
    addNewNodeIntoParent(newNode, op.path, parent);
  } else {
    const children = getChildren(node);
    const after = children.getRange(op.position);
    const newNode = createNodeWithChildren(
      after,
      op.properties as Partial<Element>,
      runtime,
      root,
    );
    addNewNodeIntoParent(newNode, op.path, parent);
    children.remove(op.position, children.getLength());
  }
};

export { applySplitNodeOperation };
