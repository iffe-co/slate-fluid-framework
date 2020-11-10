import { SharedMap } from '@fluidframework/map';
import {
  SequenceDeltaEvent,
  SharedObjectSequence,
  SharedString,
} from '@fluidframework/sequence';
import { Operation } from 'slate';

import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { getNodeFromCacheByHandle } from './dds-cache';
import { Observable } from 'rxjs';

const subPageCache = {};

type RootType = SharedObjectSequence<IFluidHandle<SharedMap>>;

class SidebarModel {
  observable: Observable<Operation[]>;

  onSidebarChange!: (ops: Operation[]) => void;

  constructor(private root: RootType) {
    const _this = this;
    this.observable = new Observable(subscriber => {
      _this.onSidebarChange = (ops: Operation[]) => {
        subscriber.next(ops);
      };
    });
  }

  bindRootChangedEvent() {
    this.root.on(
      'sequenceDelta',
      (event: SequenceDeltaEvent, target: RootType) => {
        // TODO: 当insert or remove的节点是page type的时候生成对应的op
        const op = {} as any;
        this.onSidebarChange([op]);
      },
    );
  }

  isSubPageNode(nodeHandle: IFluidHandle<SharedMap>) {
    const node = getNodeFromCacheByHandle(nodeHandle);
    return node.get('type') === 'page';
  }

  getNodeValue(nodeHandle: IFluidHandle<SharedMap>) {
    const node = getNodeFromCacheByHandle(nodeHandle);
    const subPageId = node.get('src');
    const subPage: { title: string; icon: string } = this.getSubPageFromCache(
      '',
    ) as any; // will get sub page model from server
    return { title: subPage.title, icon: subPage.icon };
  }

  getSubPageFromCache(id: string) {
    return subPageCache[id];
  }

  filterSubPages(root: RootType) {
    const subPages = this.root
      .getItems(0)
      .map((v, i) => ({ nodeHandle: v, index: i }))
      .filter(({ nodeHandle }) => this.isSubPageNode(nodeHandle));
    return subPages;
  }

  fetch() {
    return this.filterSubPages(this.root).map(({ nodeHandle }) =>
      this.getNodeValue(nodeHandle),
    );
  }

  subscribe(): Observable<Operation[]> {
    return this.observable;
  }

  apply(ops: Operation[]) {
    ops.forEach(op => {
      if (this.applier[op.type]) {
        this.applier[op.type](op);
      }
    });
  }

  applier = {
    move_node: () => {},
    remove_node: () => {},
    insert_node: () => {},
  };
}

export { SidebarModel };
