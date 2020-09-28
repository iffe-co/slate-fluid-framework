import {
  MockContainerRuntimeFactory,
  MockFluidDataStoreRuntime,
  MockSharedObjectServices,
  MockStorage,
} from '@fluidframework/test-runtime-utils';
import { MapFactory, SharedMap } from '@fluidframework/map';
import {
  SharedObjectSequence,
  SharedObjectSequenceFactory,
  SharedString,
  SharedStringFactory,
} from '@fluidframework/sequence';
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

const buildNetSharedMap = async () => {
  const mockedRuntime = new MockFluidDataStoreRuntime();
  const factory = new MapFactory();
  const map = SharedMap.create(mockedRuntime);
  mockedRuntime.local = true;

  // Load a new SharedMap in connected state from the snapshot of the first one.
  const containerRuntimeFactory = new MockContainerRuntimeFactory();
  const mockRuntime2 = new MockFluidDataStoreRuntime();
  const containerRuntime2 = containerRuntimeFactory.createContainerRuntime(
    mockRuntime2,
  );
  const services2 = MockSharedObjectServices.createFromTree(map.snapshot());
  services2.deltaConnection = containerRuntime2.createDeltaConnection();

  const map2 = SharedMap.create(mockRuntime2);
  await map2.load('branchId1', services2);

  // Now connect the first SharedMap
  mockedRuntime.local = false;
  const containerRuntime1 = containerRuntimeFactory.createContainerRuntime(
    mockedRuntime,
  );
  const services1 = {
    deltaConnection: containerRuntime1.createDeltaConnection(),
    objectStorage: new MockStorage(undefined),
  };
  map.connect(services1);
  return {
    maps: [map, map2],
    sendMessage: () => containerRuntimeFactory.processAllMessages(),
  };
};

export { buildNetSharedMap };
