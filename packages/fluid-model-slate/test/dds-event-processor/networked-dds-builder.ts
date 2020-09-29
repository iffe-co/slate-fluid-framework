import {
  MockContainerRuntimeFactory,
  MockFluidDataStoreRuntime,
  MockStorage,
} from '@fluidframework/test-runtime-utils';
import { SharedMap } from '@fluidframework/map';
import {
  SharedObjectSequence,
  SharedObjectSequenceFactory,
  SharedString,
  SharedStringFactory,
} from '@fluidframework/sequence';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { IFluidHandle } from '@fluidframework/core-interfaces';
const uuid = require('uuid');

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

const buildNetSharedMap = () =>
  buildNetSharedDds(runtime => SharedMap.create(runtime));
const buildNetSharedString = () =>
  buildNetSharedDds(runtime => SharedString.create(runtime));
const buildNetSharedObjectSequence = () =>
  buildNetSharedDds(runtime =>
    SharedObjectSequence.create<IFluidHandle<SharedMap>>(runtime),
  );

type ISharedType =
  | SharedMap
  | SharedString
  | SharedObjectSequence<IFluidHandle<SharedMap>>;

const buildNetSharedDds = async <T extends ISharedType>(
  ddsCreator: (runtime: IFluidDataStoreRuntime) => T,
) => {
  const dataStoreRuntime1 = new MockFluidDataStoreRuntime();
  const sharedString = ddsCreator(dataStoreRuntime1);
  const containerRuntimeFactory = new MockContainerRuntimeFactory();

  // Connect the first SharedString.
  dataStoreRuntime1.local = false;
  const containerRuntime1 = containerRuntimeFactory.createContainerRuntime(
    dataStoreRuntime1,
  );
  const services1 = {
    deltaConnection: containerRuntime1.createDeltaConnection(),
    objectStorage: new MockStorage(),
  };
  sharedString.initializeLocal();
  sharedString.connect(services1);

  // Create and connect a second SharedString.
  const dataStoreRuntime2 = new MockFluidDataStoreRuntime();
  const containerRuntime2 = containerRuntimeFactory.createContainerRuntime(
    dataStoreRuntime2,
  );
  const services2 = {
    deltaConnection: containerRuntime2.createDeltaConnection(),
    objectStorage: new MockStorage(),
  };
  const sharedString2 = ddsCreator(dataStoreRuntime2);
  sharedString2.initializeLocal();
  sharedString2.connect(services2);

  return {
    maps: [sharedString, sharedString2],
    sendMessage: () => containerRuntimeFactory.processAllMessages(),
  };
};

export {
  buildNetSharedMap,
  buildNetSharedString,
  buildNetSharedObjectSequence,
};
