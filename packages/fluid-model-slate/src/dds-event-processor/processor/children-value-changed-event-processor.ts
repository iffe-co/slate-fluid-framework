import {
  SequenceDeltaEvent,
  SharedObjectSequence,
  SharedString,
} from '@fluidframework/sequence';
import { FluidNodeChildren, FluidNodeHandle, FluidNode } from '../../types';
import { Operation } from '@solidoc/slate';
import { FLUIDNODE_KEYS } from '../../interfaces';
import {
  createInsertNodeOperation,
  createRemoveNodeOperation,
} from '../slate-operation-factory';
import { Path } from '../../interfaces/path';
import { getChildren } from '../../operation-applier/node-getter';
import { SharedMap } from '@fluidframework/map';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { MergeTreeDeltaType } from '@fluidframework/merge-tree';
import {
  getNodeFromCache,
  addNodeWithChildrenToCacheNeo,
  getNodeFromCacheByHandle,
} from '../../dds-cache';
import { ddsToSlateNode } from '../../convertor';
import { BaseFluidModel } from '@solidoc/fluid-model-base';
import { ProcessorContext } from '@solidoc/fluid-model-base';

function getTargetSequencePathFromRoot(
  target: FluidNodeChildren,
  root: FluidNodeChildren,
  path: Path = [],
): Path | undefined {
  if (target.id === root.id) {
    return path;
  }

  for (let i = 0; i < root.getLength(); i++) {
    const [nodeHandle] = root.getRange(i, i + 1);
    const needCheckNode = getNodeFromCacheByHandle(nodeHandle);
    const isTextNode = !needCheckNode.get(FLUIDNODE_KEYS.CHILDREN);
    if (isTextNode) {
      continue;
    } else {
      const children = getChildren(needCheckNode);

      const res = getTargetSequencePathFromRoot(target, children, [...path, i]);
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
      op[key] = await propertyProcessor[key](node.get(key));
    } else {
      op[key] = node.get(key);
    }
  }
  return op;
}

const addNodeWithChildrenToCache = async (
  node: FluidNode,
  root: FluidNodeChildren,
  model: BaseFluidModel<Operation>,
) => {
  await addNodeWithChildrenToCacheNeo(node, root);
  // TODO: need fix addListenerToNode not in model type
  (model as any).addListenerToNode &&
    (model as any).addListenerToNode(
      <IFluidHandle<SharedMap>>node.handle,
      root,
    );
};

async function insertNodeOpProcessor(
  event: SequenceDeltaEvent,
  path: number[],
  root: FluidNodeChildren,
  model: BaseFluidModel<Operation>,
): Promise<Operation[]> {
  const {
    op: {
      // @ts-ignore
      pos1: position,
      // @ts-ignore
      seg: { items },
    },
  } = event.opArgs;
  return Promise.all(
    items.map(async (rh: FluidNodeHandle, i: number) => {
      const node = (await rh.get()) as SharedMap;
      const nodeData = await convertSharedMapToSlateOp(node);
      await addNodeWithChildrenToCache(node, root, model);
      return createInsertNodeOperation([...path, i + position], nodeData);
    }),
  );
}

type Segment = {
  items: IFluidHandle<SharedMap>[];
};

async function removeNodeOpProcessor(
  event: SequenceDeltaEvent,
  path: number[],
): Promise<Operation[]> {
  const {
    op: {
      // @ts-ignore
      pos1: start,
      // @ts-ignore
      pos2: end,
    },
  } = event.opArgs;

  const items: IFluidHandle<SharedMap>[] = event.deltaArgs.deltaSegments.reduce(
    (p, c) => p.concat(((c.segment as unknown) as Segment).items),
    [] as IFluidHandle<SharedMap>[],
  );
  return Promise.all(
    items.map(async (handle, i) => {
      const node = (await handle.get()) as SharedMap;
      let nodeData = await convertSharedMapToSlateOp(node);
      return createRemoveNodeOperation([...path, start], nodeData);
    }),
  );
}

async function getOperationsPromise(
  target: FluidNodeChildren,
  root: FluidNodeChildren,
  event: SequenceDeltaEvent,
  path: Path,
  model: BaseFluidModel<Operation>,
) {
  if (event.opArgs.op.type === MergeTreeDeltaType.REMOVE.valueOf()) {
    return removeNodeOpProcessor(event, path);
  }
  if (event.opArgs.op.type === MergeTreeDeltaType.INSERT.valueOf()) {
    return insertNodeOpProcessor(event, path, root, model);
  }
  throw new Error(`Not support operation: ${event.opArgs.op}`);
}

function localEventProcessor(
  target: FluidNodeChildren,
  root: FluidNodeChildren,
  event: SequenceDeltaEvent,
  path: Path,
) {
  if (event.opArgs.op.type === MergeTreeDeltaType.REMOVE.valueOf()) {
    const {
      opArgs: {
        op: { pos1: position },
      },
      deltaArgs: { deltaSegments },
    } = (event as unknown) as {
      opArgs: {
        op: {
          pos1: number;
        };
      };
      deltaArgs: {
        deltaSegments: { segment: { items: { absolutePath: string }[] } }[];
      };
    };

    const ops = deltaSegments
      .reduce(
        (p, c) => p.concat(c.segment.items),
        [] as { absolutePath: string }[],
      )
      .map(({ absolutePath }, i: number) => {
        const nodeData = ddsToSlateNode(getNodeFromCache(absolutePath));
        return createRemoveNodeOperation([...path, i + position], nodeData);
      });

    return ops;
  }
  if (event.opArgs.op.type === MergeTreeDeltaType.INSERT.valueOf()) {
    const {
      seg: { items },
      pos1: position,
    } = event.opArgs.op as {
      seg: { items: { value: SharedMap }[] };
      pos1: number;
    };

    const ops = items.map(({ value: node }, i: number) => {
      const nodeData = ddsToSlateNode(node);
      return createInsertNodeOperation([...path, i + position], nodeData);
    });

    return ops;
  }
  throw new Error(`Not support operation: ${event.opArgs.op}`);
}

function localChildrenSequenceDeltaEventProcessor(
  event: SequenceDeltaEvent,
  target: SharedObjectSequence<IFluidHandle<SharedMap>>,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  { targetPath, model }: ProcessorContext<Operation>,
): Operation[] {
  return localEventProcessor(target, root, event, targetPath);
}

function remoteChildrenSequenceDeltaEventProcessor(
  event: SequenceDeltaEvent,
  target: SharedObjectSequence<IFluidHandle<SharedMap>>,
  root: SharedObjectSequence<IFluidHandle<SharedMap>>,
  { targetPath, model }: ProcessorContext<Operation>,
): Promise<Operation[]> {
  return getOperationsPromise(target, root, event, targetPath, model);
}

export {
  convertSharedMapToSlateOp,
  localChildrenSequenceDeltaEventProcessor,
  remoteChildrenSequenceDeltaEventProcessor,
  getTargetSequencePathFromRoot,
};
