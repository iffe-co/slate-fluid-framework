import { SequenceDeltaEvent, SharedString } from '@fluidframework/sequence';
import { FluidNodeChildren, FluidNodeHandle } from '../../types';
import { Operation } from 'slate';
import { FLUIDNODE_KEYS } from '../../interfaces';
import { createInsertNodeOperation } from '../slate-operation-factory';
import { Path } from '../../types/path';
import { getChildren } from '../../operation-applier/node-getter';
import { SharedMap } from '@fluidframework/map';
import { IFluidHandle } from '@fluidframework/core-interfaces';

async function getPathFromRoot(
  target: FluidNodeChildren,
  root: FluidNodeChildren,
  path: Path = [],
): Promise<Path | undefined> {
  if (target.id === root.id) {
    return path;
  }

  for (let i = 0; i < root.getLength(); i++) {
    const [nodeHandle] = root.getRange(i, i + 1);
    const needCheckNode = await nodeHandle.get();
    const isTextNode = !needCheckNode.get(FLUIDNODE_KEYS.CHILDREN);
    if (isTextNode) {
      continue;
    } else {
      const children = await getChildren(needCheckNode);

      const res = await getPathFromRoot(target, children, [...path, i]);
      if (!res) {
        continue;
      } else {
        return res;
      }
    }
  }
  return undefined;
}

const propertyProcessor = {
  text: async (handle: IFluidHandle<SharedString>) =>
    (await handle.get()).getText(),
  children: async (handle: IFluidHandle<FluidNodeChildren>) => {
    let children = await handle.get();
    return Promise.all(
      children.getItems(0, children.getLength()).map(async nodeHandle => {
        const node = await nodeHandle.get();
        return convertSharedMapToSlateOp(node);
      }),
    );
  },
};

async function convertSharedMapToSlateOp(node: SharedMap) {
  const op = {};
  for (let key of node.keys()) {
    if (key === FLUIDNODE_KEYS.TEXT || key === FLUIDNODE_KEYS.CHILDREN) {
      op[key] = await propertyProcessor[key];
    } else {
      op[key] = node.get(key);
    }
  }
  return op;
}

async function process(
  event: SequenceDeltaEvent,
  path: number[],
): Promise<Operation[]> {
  // @ts-ignore
  const {
    op: {
      pos1: position,
      seg: { items },
      type,
    },
  } = event.opArgs;

  return Promise.all(
    items.map(async (rh: FluidNodeHandle, i: number) => {
      const node = (await rh.get()) as SharedMap;
      let nodeData = await convertSharedMapToSlateOp(node);
      return createInsertNodeOperation([...path, i + position], nodeData);
    }),
  );
}

async function childrenSequenceDeltaEventProcessor(
  event: SequenceDeltaEvent,
  target: FluidNodeChildren,
  root: FluidNodeChildren,
): Promise<Operation[] | undefined> {
  if (event.isLocal) {
    return;
  }
  const path = (await getPathFromRoot(target, root)) || [];
  return process(event, path);
}

export { childrenSequenceDeltaEventProcessor };
