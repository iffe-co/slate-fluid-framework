import * as mocks from '@fluidframework/test-runtime-utils';
import {
  SharedObjectSequence,
  SharedObjectSequenceFactory,
  SharedString,
  SharedStringFactory,
} from '@fluidframework/sequence';
import { SharedMap } from '@fluidframework/map';
import {addChildrenToCache, addNodeToCache, addTextToCache} from "../../src/dds-cache";
const uuid = require('uuid');

export const mockRuntime: mocks.MockFluidDataStoreRuntime = new mocks.MockFluidDataStoreRuntime();

const originalDdsCreate = {
  shareString: SharedString.create,
  sharedMap: SharedMap.create,
  sharedObjectSequence: SharedObjectSequence.create,
};

const mockInsertDDSIntoCache = () => {
  const createSeq = SharedObjectSequence.create
  SharedObjectSequence.create = <T>(rt: any, id?: string) => {
    const seq = createSeq<T>(rt, id)
    addChildrenToCache(seq as any)
    return seq
  }

  const createMap = SharedMap.create
  SharedMap.create = (rt, id?: string) => {
    const map = createMap(rt, id)
    addNodeToCache(map)
    return map
  }

  const createString = SharedString.create
  SharedString.create = (rt, id?: string) => {
    const string = createString(rt, id)
    addTextToCache(string)
    return string
  }
}
export const mockDdsCreate = () => {
  SharedString.create = runtime =>
    new SharedString(runtime, uuid.v4(), SharedStringFactory.Attributes);
  SharedMap.create = runtime =>
    new SharedMap(uuid.v4(), runtime, SharedMap.getFactory().attributes);
  SharedObjectSequence.create = runtime =>
    new SharedObjectSequence(
      runtime,
      uuid.v4(),
      SharedObjectSequenceFactory.Attributes,
    );

  mockInsertDDSIntoCache()
};

export const restoreDdsCreate = () => {
  SharedString.create = originalDdsCreate.shareString;
  SharedMap.create = originalDdsCreate.sharedMap;
  SharedObjectSequence.create = originalDdsCreate.sharedObjectSequence;
  mockInsertDDSIntoCache()
};
