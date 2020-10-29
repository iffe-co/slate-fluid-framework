import {IUrlResolver} from '@fluidframework/driver-definitions';
import {IContainer, IFluidCodeDetails, ILoader,} from '@fluidframework/container-definitions';
import {LocalResolver} from '@fluidframework/local-driver';
import {SharedObjectSequence, SharedString,} from '@fluidframework/sequence';
import {requestFluidObject} from '@fluidframework/runtime-utils';
import {ILocalDeltaConnectionServer, LocalDeltaConnectionServer,} from '@fluidframework/server-local-server';
import {SharedMap} from '@fluidframework/map';
import {
  createAndAttachContainer,
  createLocalLoader,
  ITestFluidObject,
  OpProcessingController,
  TestFluidObjectFactory,
} from '@fluidframework/test-utils';

import {IFluidDataStoreFactory} from '@fluidframework/runtime-definitions';
import {IFluidHandle} from '@fluidframework/core-interfaces';
import {IChannelFactory} from '@fluidframework/datastore-definitions';
import {addChildrenToCache, addNodeToCache, addTextToCache} from "../../src/dds-cache";
import {FluidNodeHandle} from "../../src/types";

Object.defineProperty(window, 'performance', {
  value: undefined,
  writable: false,
});

const uuid = require('uuid');

const stringId = 'stringKey';
const codeDetails: IFluidCodeDetails = {
  package: 'localServerTestPackage',
  config: {},
};

async function createContainer(
  factory: IFluidDataStoreFactory,
  documentId: string,
  deltaConnectionServer: ILocalDeltaConnectionServer,
  urlResolver: IUrlResolver,
): Promise<IContainer> {
  const loader: ILoader = createLocalLoader(
    [[codeDetails, factory]],
    deltaConnectionServer,
    urlResolver,
  );
  return createAndAttachContainer(documentId, codeDetails, loader, urlResolver);
}

async function loadContainer(
  factory: IFluidDataStoreFactory,
  documentLoadUrl: string,
  deltaConnectionServer: ILocalDeltaConnectionServer,
  urlResolver: IUrlResolver,
): Promise<IContainer> {
  const loader: ILoader = createLocalLoader(
    [[codeDetails, factory]],
    deltaConnectionServer,
    urlResolver,
  );
  return loader.resolve({url: documentLoadUrl});
}

type ISharedType =
  | SharedMap
  | SharedString
  | SharedObjectSequence<IFluidHandle<SharedMap>>
  | SharedObjectSequence<string>;

const addDDSToCache = (dds: ISharedType) => {
  if (dds instanceof SharedString) {
    addTextToCache(dds)
  }
  if (dds instanceof SharedMap) {
    addNodeToCache(dds)
  }
  if (dds instanceof SharedObjectSequence) {
    addChildrenToCache(dds as SharedObjectSequence<FluidNodeHandle>)
  }
}

async function buildE2eSharedDds<T extends ISharedType>(
    ddsFactory: IChannelFactory,
) {
  let documentId = uuid.v4();
  const documentLoadUrl = `fluid-test://localhost/${documentId}`;

  const deltaConnectionServer = LocalDeltaConnectionServer.create();
  const urlResolver = new LocalResolver();

  const factory = new TestFluidObjectFactory([
    [stringId, ddsFactory],
    [uuid.v4(), SharedMap.getFactory()],
    [uuid.v4(), SharedString.getFactory()],
  ]);
  const container1 = await createContainer(
    factory,
    documentId,
    deltaConnectionServer,
    urlResolver,
  );
  const dataObject1 = await requestFluidObject<ITestFluidObject>(
    container1,
    'default',
  );
  const dds1 = await dataObject1.getSharedObject<T>(stringId);
  addDDSToCache(dds1)

  const container2 = await loadContainer(
    factory,
    documentLoadUrl,
    deltaConnectionServer,
    urlResolver,
  );
  const dataObject2 = await requestFluidObject<ITestFluidObject>(
    container2,
    'default',
  );
  const dds2 = await dataObject2.getSharedObject<T>(stringId);
  addDDSToCache(dds2)

  const opProcessingController = new OpProcessingController(
    deltaConnectionServer,
  );
  opProcessingController.addDeltaManagers(
    dataObject1.runtime.deltaManager,
    dataObject2.runtime.deltaManager,
  );
  await opProcessingController.pauseProcessing();

  return {
    dds: [dds1, dds2],
    runtime: [dataObject1.runtime, dataObject2.runtime],
    syncDds: async (times: number) => {
        for (let i = 0; i < times; i++) {
            await opProcessingController.process(dataObject1.runtime.deltaManager);
            await opProcessingController.process(dataObject2.runtime.deltaManager);
        }
    },
    close: async () => await deltaConnectionServer.webSocketServer.close(),
  };
}

const buildE2eSharedMap = () =>
  buildE2eSharedDds<SharedMap>(SharedMap.getFactory());
const buildE2eSharedString = () =>
  buildE2eSharedDds<SharedString>(SharedString.getFactory());
const buildE2eSharedObjectSequence = () =>
  buildE2eSharedDds<SharedObjectSequence<IFluidHandle<SharedMap>>>(
      SharedObjectSequence.getFactory(),
  );

export {
  buildE2eSharedDds,
  buildE2eSharedMap,
  buildE2eSharedString,
  buildE2eSharedObjectSequence,
};
