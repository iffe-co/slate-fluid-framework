import { FluidNode, FluidNodeChildren, FluidNodeProperty } from '../types';
import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { SequenceDeltaEvent } from '@fluidframework/sequence';
import { Operation } from 'slate';
import {
  processFluidNodeValueChangedEvent,
  processFluidTextValueChangedEvent,
} from './processor';

type OperationReceiver = (op: Operation) => void;
const operationTransmitter: OperationReceiver[] = [];
const registerOperationReceiver = (receiver: OperationReceiver) =>
  operationTransmitter.push(receiver);
const broadcastOp = (op: Operation) => operationTransmitter.forEach(t => t(op));

function bindFluidNodeEvent(fluidNode: FluidNode, root: FluidNodeChildren) {
  fluidNode.on(
    'valueChanged',
    async (
      event: IValueChanged,
      local: boolean,
      op: ISequencedDocumentMessage,
      target: FluidNode,
    ) => {
      const slateOp = await processFluidNodeValueChangedEvent(
        event,
        local,
        op,
        target,
        root,
      );
      if (slateOp) {
        broadcastOp(slateOp);
      }
    },
  );
}

function fluidNodePropertyEventBinder(
  fluidNodeProperty: FluidNodeProperty,
  root: FluidNodeChildren,
) {
  fluidNodeProperty.on(
    'sequenceDelta',
    async (event: SequenceDeltaEvent, target: FluidNodeProperty) => {
      const slateOps = await processFluidTextValueChangedEvent(
        event,
        target,
        root,
      );
      if (slateOps) {
        slateOps.forEach(broadcastOp);
      }
    },
  );
}

function fluidNodeChildrenEventBinder(fluidNodeChildren: FluidNodeChildren) {
  fluidNodeChildren.on(
    'fluidNodeChildren',
    (event: SequenceDeltaEvent, target: FluidNodeChildren) => {},
  );
}

export {
  bindFluidNodeEvent,
  fluidNodeChildrenEventBinder,
  fluidNodePropertyEventBinder,
  registerOperationReceiver,
};
