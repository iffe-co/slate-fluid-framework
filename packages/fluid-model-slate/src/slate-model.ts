import { BaseFluidModel } from '@solidoc/fluid-model-base';
import { IValueChanged, SharedMap } from '@fluidframework/map';
import { SharedObjectSequence, SharedString } from '@fluidframework/sequence';
import { DataObjectFactory, IDataObjectProps } from '@fluidframework/aqueduct';
import { FLUIDNODE_KEYS } from './interfaces';
import { Operation } from '@solidoc/slate';
import { operationApplier } from './operation-applier/operation-applier';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';

import {
  FluidNode,
  FluidNodeChildren,
  FluidNodeChildrenHandle,
  FluidNodePropertyHandle,
} from './types';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import {
  addChildrenToCache,
  addNodeToCache,
  addTextToCache,
  getChildrenFromCacheByHandle,
  getNodeFromCacheByHandle,
  getTextFromCacheByHandle,
} from './dds-cache';
import { addEventListenerHandler } from './event-handler';
import { convertSharedMapToSlateOp } from './dds-event-processor/processor/children-value-changed-event-processor';
import { ddsChangesQueue } from './dds-changes-queue';
import { Observable, Subscriber } from 'rxjs';
import { createSetNodeOperation } from '.';

class SlateFluidModel extends BaseFluidModel<Operation> {
  private observable?: Observable<Operation[]>;
  private docPropertiesChangedOpReceiver = (op: Operation) => {};

  notifyConsumer = (subscriber: Subscriber<Operation[]>) => {
    ddsChangesQueue.registerOperationsBroadcast(
      this.fluidNodeSequence.id,
      ops => subscriber.next(ops),
    );
    this.docPropertiesChangedOpReceiver = (op: Operation) =>
      subscriber.next([op]);
  };

  private docProperties!: SharedMap;
  private fluidNodeSequence!: SharedObjectSequence<IFluidHandle<SharedMap>>;

  public getDocContentAndProperties = () => {
    return {
      content: this.fluidNodeSequence,
      properties: this.docProperties,
      getImmediateChildren: this.getImmediateChildren,
    };
  };

  private getImmediateChildren = () => {
    return this.fluidNodeSequence
      .getItems(0)
      .map(nodeHandle => getNodeFromCacheByHandle(nodeHandle));
  };

  public constructor(props: IDataObjectProps) {
    super(props);
    this.runtime = props.runtime;
  }

  public runtime: IFluidDataStoreRuntime;

  public static get Name() {
    return 'slate-fluid-model';
  }

  public static readonly factory = new DataObjectFactory(
    SlateFluidModel.Name,
    SlateFluidModel,
    [
      SharedMap.getFactory(),
      SharedObjectSequence.getFactory(),
      SharedString.getFactory(),
    ],
    {},
  );

  apply(ops: Operation[]) {
    ops.forEach(op => console.log(op));
    ops.forEach(op =>
      operationApplier[op.type](op, this.fluidNodeSequence, this.runtime),
    );

    const nodes = this.fluidNodeSequence.getRange(0);

    Promise.all(
      nodes.map(n => convertSharedMapToSlateOp(getNodeFromCacheByHandle(n))),
    ).then(v => console.log(v));
  }

  protected async initializingFirstTime() {
    const fluidNodeSequence = SharedObjectSequence.create(this.runtime);
    const node_0 = SharedMap.create(this.runtime);
    const node_0_children = SharedObjectSequence.create(this.runtime);
    const node_0_0 = SharedMap.create(this.runtime);
    const node_0_0_text = SharedString.create(this.runtime);

    node_0.set(FLUIDNODE_KEYS.CHILDREN, node_0_children.handle);
    node_0_children.insert(0, [node_0_0.handle]);
    node_0_0.set(FLUIDNODE_KEYS.TEXT, node_0_0_text.handle);

<<<<<<< HEAD
    // const node_1 = SharedMap.create(this.runtime);
    // const node_1_text = SharedString.create(this.runtime);
    // node_1.set(FLUIDNODE_KEYS.TEXT, node_1_text.handle);
    // node_1.set(FLUIDNODE_KEYS.TYPE, 'Page');
    // node_1.set(FLUIDNODE_KEYS.ID, 'SubPageID_SLATE' + new Date().getTime());

    // fluidNodeSequence.insert(0, [node_0.handle, node_1.handle]);
    fluidNodeSequence.insert(0, [node_0.handle]);

=======
>>>>>>> f93b52432ce3535899f1fc87318962a0ac7f96e1
    this.fluidNodeSequence = fluidNodeSequence as SharedObjectSequence<
      IFluidHandle<SharedMap>
    >;
    this.root.set(FLUIDNODE_KEYS.CHILDREN, fluidNodeSequence.handle);

    // init doc properties
    const docProperties = SharedMap.create(this.runtime);
    docProperties.set(FLUIDNODE_KEYS.TITLE, 'default title');
    docProperties.set(FLUIDNODE_KEYS.ICON, '');
    docProperties.set(FLUIDNODE_KEYS.TYPE, 'Page');

    this.docProperties = docProperties;
    this.root.set(FLUIDNODE_KEYS.PROPERTIES, docProperties.handle);
  }

  protected async hasInitialized() {
    [this.fluidNodeSequence, this.docProperties] = await Promise.all([
      this.root.get(FLUIDNODE_KEYS.CHILDREN).get(),
      this.root.get(FLUIDNODE_KEYS.PROPERTIES).get(),
    ]);

    await this.addDDSToCache();
    addEventListenerHandler(this.fluidNodeSequence);

    this.onDocPropertiesChanged();
  }

  private onDocPropertiesChanged() {
    this.docProperties.on(
      'valueChanged',
      (
        event: IValueChanged,
        local: boolean,
        op: ISequencedDocumentMessage,
        target: FluidNode,
      ) => {
        if (local) {
          return;
        }
        const type = op.contents.type;
        if (type === 'set') {
          const path: number[] = [];
          const properties = { [event.key]: event.previousValue };
          const newProperties = { [event.key]: target.get(event.key) };
          const op = createSetNodeOperation(path, properties, newProperties);
          this.docPropertiesChangedOpReceiver(op);
        }
        return;
      },
    );
  }

  private async addDDSToCache() {
    const initValue = await this.toInitSlateValue(this.fluidNodeSequence);
    console.log('init value', initValue);
  }

  public fetch(root?: FluidNodeChildren) {
    const slateNodes: any[] = [];
    const nodeHandles = (root || this.fluidNodeSequence).getRange(0);
    for (let nodeHandle of nodeHandles) {
      const node = getNodeFromCacheByHandle(nodeHandle);
      const slateNode = {};
      if (node.has(FLUIDNODE_KEYS.CHILDREN)) {
        const childrenHandle = node.get<FluidNodeChildrenHandle>(
          FLUIDNODE_KEYS.CHILDREN,
        );
        const children = getChildrenFromCacheByHandle(childrenHandle);
        slateNode[FLUIDNODE_KEYS.CHILDREN] = this.fetch(children);
      }
      if (node.has(FLUIDNODE_KEYS.TEXT)) {
        const textHandle = node.get<FluidNodePropertyHandle>(
          FLUIDNODE_KEYS.TEXT,
        );
        const text = getTextFromCacheByHandle(textHandle);
        slateNode[FLUIDNODE_KEYS.TEXT] = text.getText();
      }
      [...node.keys()]
        .filter(k => k !== 'children' && k !== 'text')
        .forEach(k => {
          slateNode[k] = node.get(k);
        });
      slateNodes.push(slateNode);
    }
    return slateNodes;
  }

  private async toInitSlateValue(root: FluidNodeChildren) {
    const slateNodes: any[] = [];
    const nodeHandles = root.getRange(0);
    for (let nodeHandle of nodeHandles) {
      const node = await nodeHandle.get();
      addNodeToCache(node);
      const slateNode = {};
      if (node.has(FLUIDNODE_KEYS.CHILDREN)) {
        const children = await node
          .get<FluidNodeChildrenHandle>(FLUIDNODE_KEYS.CHILDREN)
          .get();
        addChildrenToCache(children);
        slateNode[FLUIDNODE_KEYS.CHILDREN] = await this.toInitSlateValue(
          children,
        );
      }
      if (node.has(FLUIDNODE_KEYS.TEXT)) {
        const text = await node
          .get<FluidNodePropertyHandle>(FLUIDNODE_KEYS.TEXT)
          .get();
        addTextToCache(text);
        slateNode[FLUIDNODE_KEYS.TEXT] = text.getText();
      }
      [...node.keys()]
        .filter(k => k !== 'children' && k !== 'text')
        .forEach(k => {
          slateNode[k] = node.get(k);
        });
      slateNodes.push(slateNode);
    }
    return slateNodes;
  }
}

export { SlateFluidModel };
