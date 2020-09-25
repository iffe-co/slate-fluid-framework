import {
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
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { applyInsertNodeOperation } from './applier';
import { applyInsertTextOperation } from './applier/insert-text';

const applyMergeNodeOperation = (
  op: MergeNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => Promise.resolve();
const applyMoveNodeOperation = (
  op: MoveNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => Promise.resolve();
const applyRemoveNodeOperation = (
  op: RemoveNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => Promise.resolve();
const applyRemoveTextOperation = (
  op: RemoveTextOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => Promise.resolve();
const applySetNodeOperation = (
  op: SetNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => Promise.resolve();
const applySetSelectionOperation = (
  op: SetSelectionOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => Promise.resolve();
const applySplitNodeOperation = (
  op: SplitNodeOperation,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  runtime: IFluidDataStoreRuntime,
) => Promise.resolve();

type OperationApplier = {
  [key: string]: (
    op: any,
    root: SharedObjectSequence<IFluidHandle<SharedMap>>,
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
