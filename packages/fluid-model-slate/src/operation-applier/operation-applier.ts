import {
  MergeNodeOperation,
  MoveNodeOperation,
  RemoveNodeOperation,
  SetSelectionOperation,
} from 'slate';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { applyInsertNodeOperation } from './applier';
import { applyInsertTextOperation } from './applier/insert-text';
import { applyRemoveTextOperation } from './applier/remove-text';
import { applySplitNodeOperation } from './applier/split-node';
import { FluidNodeChildren } from '../types';
import { applySetNodeOperation } from './applier/set-node';
import { applyMergeNodeOperation } from './applier/merge-node';

const applyMoveNodeOperation = (
  op: MoveNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => Promise.resolve();
const applyRemoveNodeOperation = (
  op: RemoveNodeOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => Promise.resolve();
const applySetSelectionOperation = (
  op: SetSelectionOperation,
  root: FluidNodeChildren,
  runtime: IFluidDataStoreRuntime,
) => Promise.resolve();
type OperationApplier = {
  [key: string]: (
    op: any,
    root: FluidNodeChildren,
    runtime: IFluidDataStoreRuntime,
  ) => Promise<void>;
};

const operationApplier: OperationApplier = {
  insert_node: applyInsertNodeOperation,
  insert_text: applyInsertTextOperation,
  merge_node: applyMergeNodeOperation,
  move_node: applyMoveNodeOperation,
  remove_node: applyRemoveNodeOperation,
  remove_text: applyRemoveTextOperation,
  set_node: applySetNodeOperation,
  set_selection: applySetSelectionOperation,
  split_node: applySplitNodeOperation,
};

export { operationApplier };
