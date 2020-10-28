import { SequenceDeltaEvent } from '@fluidframework/sequence';
import { FluidNodeChildren, FluidNodeProperty } from '../../types';
import { Operation } from 'slate';
import { FLUIDNODE_KEYS } from '../../interfaces';
import {
  createInsertTextOperation,
  createRemoveTextOperation,
} from '../slate-operation-factory';
import { MergeTreeDeltaType, TextSegment } from '@fluidframework/merge-tree';
import { Path } from '../../types/path';
import { getChildren } from '../../operation-applier/node-getter';
import { getNodeFromCacheByHandle } from '../../dds-cache';

function getTextPathFromRoot(
  text: FluidNodeProperty,
  root: FluidNodeChildren,
  path: Path = [],
): Path | undefined {
  for (let i = 0; i < root.getLength(); i++) {
    const [nodeHandle] = root.getRange(i, i + 1);
    const needCheckNode = getNodeFromCacheByHandle(nodeHandle);
    const isTextNode = !needCheckNode.get(FLUIDNODE_KEYS.CHILDREN);
    if (isTextNode) {
      const id = needCheckNode.get(FLUIDNODE_KEYS.TEXT).absolutePath;
      if (id === (text.handle as any).absolutePath) {
        return [...path, i];
      } else {
        continue;
      }
    } else {
      const children = getChildren(needCheckNode);

      const res = getTextPathFromRoot(text, children, [...path, i]);
      if (!res) {
        continue;
      } else {
        return res;
      }
    }
  }
  return undefined;
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

function getOperationPromise(
  event: SequenceDeltaEvent,
  target: FluidNodeProperty,
  root: FluidNodeChildren,
) {
  const path = getTextPathFromRoot(target, root) || [];
  return process(event, path);
}

function textSequenceDeltaEventProcessor(
  event: SequenceDeltaEvent,
  target: FluidNodeProperty,
  root: FluidNodeChildren,
): Operation[] | undefined {
  if (event.isLocal) {
    return;
  }
  checkEventType(event);
  return getOperationPromise(event, target, root);
}

export { textSequenceDeltaEventProcessor };
