import { MergeNodeOperation } from '@solidoc/slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import {
  getChildren,
  getNode,
  getParent,
  getPrevious,
  getText,
} from '../node-getter';
import { FluidNode, FluidNodeChildren } from '../../types';
import { FLUIDNODE_KEYS } from '../../interfaces';

const isTextNode = (node: FluidNode) => node.has(FLUIDNODE_KEYS.TEXT);

const applyMergeNodeOperation = (
  op: MergeNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const { path } = op;
  const node = getNode(path, root);
  const prevNode = getPrevious(path, root);
  const parent = getParent(path, root);
  const index = path[path.length - 1];

  if (isTextNode(node) !== isTextNode(prevNode)) {
    throw new Error(
      `Cannot apply a "merge_node" operation at path [${path}] to nodes of different interacts`,
    );
  }

  if (isTextNode(node) && isTextNode(prevNode)) {
    const prevText = getText(prevNode);
    const text = getText(node);
    prevText.insertText(prevText.getLength(), text.getText());
    parent.remove(index, index + 1);
    return;
  }

  if (!isTextNode(node) && !isTextNode(prevNode)) {
    const prevChildren = getChildren(prevNode);
    const children = getChildren(node);

    prevChildren.insert(
      prevChildren.getLength(),
      children.getRange(0, children.getLength()),
    );
    parent.remove(index, index + 1);
    return;
  }
  throw new Error(`Invalid node type at path [${path}]`);
};

export { applyMergeNodeOperation };
