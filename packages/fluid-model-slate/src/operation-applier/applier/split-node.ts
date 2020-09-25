import {SplitNodeOperation} from 'slate';
import {SharedObjectSequence, SharedString} from '@fluidframework/sequence';
import {IFluidHandle} from '@fluidframework/core-interfaces';
import {SharedMap} from '@fluidframework/map';
import {IFluidDataStoreRuntime} from '@fluidframework/datastore-definitions';
import {getChildren, getNode, getParent, getText} from '../node-getter';
import {createNode, createNodeWithChildren} from "../element-factory";
import {FLUIDNODE_KEYS} from "../../interfaces";

function addNewNodeIntoParent(newNode: SharedMap, path: number[], parent: SharedObjectSequence<IFluidHandle<SharedMap>>) {
  const [index] = path.slice(-1);
  parent.insert(index + 1, [<IFluidHandle<SharedMap>>newNode.handle])
}

const applySplitNodeOperation = async (
  op: SplitNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = await getNode(op.path, root);
  const parent = await getParent(op.path, root);

  if (node.has(FLUIDNODE_KEYS.TEXT)) {
    const text = await getText(node);
    const originText = text.getText();
    const after = originText.slice(op.position);
    text.removeText(op.position, originText.length);
    const newNode = createNode({text: after}, runtime)
    addNewNodeIntoParent(newNode, op.path, parent);
  } else {
    const children = await getChildren(node);
    const after = children.getRange(op.position)
    const newNode = createNodeWithChildren(after, runtime)
    addNewNodeIntoParent(newNode, op.path, parent);
    children.remove(op.position, children.getLength())
  }
};

export { applySplitNodeOperation };
