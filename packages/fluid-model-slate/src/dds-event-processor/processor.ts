import { IValueChanged } from '@fluidframework/map';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import {
  FluidNode,
  FluidNodeChildren,
  FluidNodeProperty,
  FluidNodePropertyHandle,
} from '../types';
import { FLUIDNODE_KEYS } from '../interfaces';
import {
  createInsertTextOperation,
  createRemoveTextOperation,
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

async function getTextPathFromRoot(
  text: FluidNodeProperty,
  root: FluidNodeChildren,
  path: Path = [],
): Promise<Path | undefined> {
  for (let i = 0; i < root.getLength(); i++) {
    const [nodeHandle] = root.getRange(i, i + 1);
    const needCheckNode = await nodeHandle.get();
    const isTextNode = !needCheckNode.get(FLUIDNODE_KEYS.CHILDREN);
    if (isTextNode) {
      const id = needCheckNode.get(FLUIDNODE_KEYS.TEXT).path;
      if (id === (text.handle as any).path) {
        return [...path, i];
      } else {
        continue;
      }
    } else {
      const children = await getChildren(needCheckNode);

      const res = await getTextPathFromRoot(text, children, [...path, i]);
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

function process(event: SequenceDeltaEvent, path: number[]) {
  return event.ranges.map(r => {
    if ((r.operation as number) === MergeTreeDeltaType.INSERT) {
      const segment = (r.segment as unknown) as TextSegment;
      return createInsertTextOperation(path, segment.text, r.position);
    }
    if ((r.operation as number) === MergeTreeDeltaType.REMOVE) {
      const segment = (r.segment as unknown) as TextSegment;
      return createRemoveTextOperation(path, segment.text, r.position);
    }

    console.log(event.opArgs, event.ranges);
    throw new Error('Not implement event processor');
  });
}

async function processFluidTextValueChangedEvent(
  event: SequenceDeltaEvent,
  target: FluidNodeProperty,
  root: FluidNodeChildren,
): Promise<Operation[] | undefined> {
  if (event.isLocal) {
    return;
  }
  checkEventType(event);
  const path = (await getTextPathFromRoot(target, root)) || [];
  return process(event, path);
}

export { processFluidNodeValueChangedEvent, processFluidTextValueChangedEvent };
