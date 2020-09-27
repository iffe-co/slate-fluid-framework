import { MergeNodeOperation } from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import {getChildren, getNode, getParent, getPrevious, getText} from '../node-getter';
import {FluidNode, FluidNodeChildren} from '../../types';
import {FLUIDNODE_KEYS} from "../../interfaces";

const isTextNode = (node:FluidNode) => node.has(FLUIDNODE_KEYS.TEXT)

const applyMergeNodeOperation = async (
  op: MergeNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => {
  const {path} = op
  const node = await getNode(path, root);
  const prevNode = await getPrevious(path, root)
  const parent = await getParent(path, root)
  const index = path[path.length - 1]

  if (isTextNode(node) !== isTextNode(prevNode)) {
    throw new Error(
        `Cannot apply a "merge_node" operation at path [${path}] to nodes of different interacts`
    )
  }

  if (isTextNode(node) && isTextNode(prevNode)) {
    const prevText = await getText(prevNode)
    const text = await getText(node)
    prevText.insertText(prevText.getLength(), text.getText())
  }

  if (!isTextNode(node) && !isTextNode(prevNode)) {
    const prevChildren = await getChildren(prevNode)
    const children = await getChildren(node)
    prevChildren.insert(prevChildren.getLength(), children.getRange(0, children.getLength()))
  }

  parent.remove(index, index + 1)
};

export { applyMergeNodeOperation };
