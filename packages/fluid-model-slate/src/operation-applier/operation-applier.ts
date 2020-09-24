import {
  InsertNodeOperation,
  MergeNodeOperation,
  MoveNodeOperation,
  RemoveNodeOperation,
  RemoveTextOperation,
  SetNodeOperation,
  SetSelectionOperation,
  SplitNodeOperation,
} from 'slate';
import { SharedObjectSequence } from '@fluidframework/sequence';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { SharedMap } from '@fluidframework/map';

const applyInsertNodeOperation = (
  op: InsertNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
) => {};
const applyMergeNodeOperation = (
  op: MergeNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
) => {};
const applyMoveNodeOperation = (
  op: MoveNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
) => {};
const applyRemoveNodeOperation = (
  op: RemoveNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
) => {};
const applyRemoveTextOperation = (
  op: RemoveTextOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
) => {};
const applySetNodeOperation = (
  op: SetNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
) => {};
const applySetSelectionOperation = (
  op: SetSelectionOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
) => {};
const applySplitNodeOperation = (
  op: SplitNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
) => {};

const operationApplier = {
  insert_node: applyInsertNodeOperation,
  merge_node: applyMergeNodeOperation,
  move_node: applyMoveNodeOperation,
  remove_node: applyRemoveNodeOperation,
  remove_text: applyRemoveTextOperation,
  set_node: applySetNodeOperation,
  set_selection: applySetSelectionOperation,
  split_node: applySplitNodeOperation,
};

export { operationApplier };
