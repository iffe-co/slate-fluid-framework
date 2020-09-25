import {SplitNodeOperation} from 'slate';
import {SharedObjectSequence, SharedString} from '@fluidframework/sequence';
import {IFluidHandle} from '@fluidframework/core-interfaces';
import {SharedMap} from '@fluidframework/map';
import {IFluidDataStoreRuntime} from '@fluidframework/datastore-definitions';
import {getNode, getParent, getText} from '../node-getter';
import {create} from "../element-factory";

function addNewNodeIntoParent(after: string, runtime: IFluidDataStoreRuntime, path: number[], parent: SharedObjectSequence<IFluidHandle<SharedMap>>) {
  const element = create({text: after}, runtime)
  const [index] = path.slice(-1);
  parent.insert(index + 1, [<IFluidHandle<SharedMap>>element.handle])
}

function removeSplitSecondPartFromOriginText(text: SharedString, op: SplitNodeOperation, originTextLength: number) {
  text.removeText(op.position, originTextLength);
}

const applySplitNodeOperation = async (
  op: SplitNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => {
  const node = await getNode(op.path, root);
  const parent = await getParent(op.path, root);
  const text = await getText(node);
  const originText = text.getText();
  const after = originText.slice(op.position);

  removeSplitSecondPartFromOriginText(text, op, originText.length);
  addNewNodeIntoParent(after, runtime, op.path, parent);
};

export { applySplitNodeOperation };
