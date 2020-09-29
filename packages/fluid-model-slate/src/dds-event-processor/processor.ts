import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { FluidNode, FluidNodeChildren, FluidNodeProperty } from '../types';
import { FLUIDNODE_KEYS } from '../interfaces';
import {
  createInsertTextOperation,
  createSetNodeOperation,
} from './slate-operation-factory';
import { Operation } from 'slate';
import { Path } from '../types/path';
import { getChildren } from '../operation-applier/node-getter';
import { SequenceDeltaEvent } from '@fluidframework/sequence';
import { MergeTreeDeltaType, TextSegment } from '@fluidframework/merge-tree';

const noChangedKey = [FLUIDNODE_KEYS.TEXT, FLUIDNODE_KEYS.CHILDREN];

async function getPathFromRoot(
  node: FluidNode,
  root: FluidNodeChildren,
  path: Path = [],
): Promise<Path | undefined> {
  for (let i = 0; i < root.getLength(); i++) {
    const [nodeHandle] = root.getRange(i, i + 1);
    const needCheckNode = await nodeHandle.get();
    const isTextNode = !needCheckNode.get(FLUIDNODE_KEYS.CHILDREN);
    if (isTextNode) {
      if (needCheckNode.id === (node.handle as any).path) {
        return [...path, i];
      } else {
        continue;
      }
    } else {
      const children = await getChildren(needCheckNode);

      const res = await getPathFromRoot(node, children, [...path, i]);
      if (!res) {
        continue;
      } else {
        return res;
      }
    }
  }
  return undefined;
}

async function processFluidNodeValueChangedEvent(
  event: IValueChanged,
  local: boolean,
  op: ISequencedDocumentMessage,
  target: FluidNode,
  root: FluidNodeChildren,
): Promise<Operation | undefined> {
  if (local) {
    return;
  }
  const type = op.contents.type;
  if (type === 'set' && !noChangedKey.includes(event.key as FLUIDNODE_KEYS)) {
    const path = (await getPathFromRoot(target, root)) || [];
    const properties = { [event.key]: target.get(event.key) };
    const newProperties = { [event.key]: target.get(event.key) };
    const op = createSetNodeOperation(path, properties, newProperties);
    return op;
  }
  return;
}

function checkEventType(event: SequenceDeltaEvent) {
  if (!event.ranges.every(r => r.segment.type === TextSegment.type)) {
    throw new Error('This processor is only support "SharedString" type');
  }
}

function process(event: SequenceDeltaEvent) {
  return event.ranges.map(r => {
    if ((r.operation as number) === MergeTreeDeltaType.INSERT) {
      const segment = (r.segment as unknown) as TextSegment;
      return createInsertTextOperation([], segment.text, r.position);
    }
    if ((r.operation as number) === MergeTreeDeltaType.REMOVE) {
      const segment = (r.segment as unknown) as TextSegment;
      return createInsertTextOperation([], segment.text, r.position);
    }

    console.log(event.opArgs, event.ranges);
    throw new Error('Not implement event processor');
  });
}

function processFluidTextValueChangedEvent(
  event: SequenceDeltaEvent,
  target: FluidNodeProperty,
  root: FluidNodeChildren,
): Operation[] | undefined {
  if (event.isLocal) {
    return;
  }
  checkEventType(event);
  return process(event);
}

export { processFluidNodeValueChangedEvent, processFluidTextValueChangedEvent };
