import { FluidNode, FluidNodeChildren, FluidNodeProperty } from '../types';
import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { SequenceDeltaEvent } from '@fluidframework/sequence';
import { Operation } from 'slate';
import { processFluidNodeValueChangedEvent } from './processor';

type OperationReceiver = (op: Operation) => void;
const operationTransmitter: OperationReceiver[] = [];
const registerOperationReceiver = (receiver: OperationReceiver) =>
  operationTransmitter.push(receiver);
const broadcastOp = (op: Operation) => operationTransmitter.forEach(t => t(op));

function bindFluidNodeEvent(fluidNode: FluidNode) {
  fluidNode.on(
    'valueChanged',
    (
      event: IValueChanged,
      local: boolean,
      op: ISequencedDocumentMessage,
      target: FluidNode,
    ) => {
      const slateOp = processFluidNodeValueChangedEvent(
        event,
        local,
        op,
        target,
      );
      if (slateOp) {
        broadcastOp(slateOp);
      }
    },
  );
}

function fluidNodePropertyEventBinder(fluidNodeProperty: FluidNodeProperty) {
  fluidNodeProperty.on(
    'sequenceDelta',
    (event: SequenceDeltaEvent, target: FluidNodeProperty) => {},
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
