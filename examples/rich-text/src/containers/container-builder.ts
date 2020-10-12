Object.defineProperty(window, 'performance', {
  value: undefined,
  writable: false,
});

import {
  IContainer,
  IFluidCodeDetails,
  ILoader,
} from '@fluidframework/container-definitions';
import { IUrlResolver } from '@fluidframework/driver-definitions';
import { LocalResolver } from '@fluidframework/local-driver';
import { requestFluidObject } from '@fluidframework/runtime-utils';
import {
  ILocalDeltaConnectionServer,
  LocalDeltaConnectionServer,
} from '@fluidframework/server-local-server';
import {
  createAndAttachContainer,
  createLocalLoader,
  ITestFluidObject,
} from '@fluidframework/test-utils';

import { IFluidDataStoreFactory } from '@fluidframework/runtime-definitions';
import { SlateFluidModel } from '@solidoc/fluid-model-slate';

const codeDetails: IFluidCodeDetails = {
  package: 'localServerTestPackage',
  config: {},
};
const uuid = require('uuid');

async function createContainer(
  factory: IFluidDataStoreFactory,
  documentId: string,
  deltaConnectionServer: ILocalDeltaConnectionServer,
  urlResolver: IUrlResolver,
): Promise<IContainer> {
  const loader: ILoader = createLocalLoader(
    // @ts-ignore
    [[codeDetails, factory]],
    deltaConnectionServer,
    urlResolver,
  );
  // @ts-ignore
  return createAndAttachContainer(documentId, codeDetails, loader, urlResolver);
}

async function loadContainer(
  factory: IFluidDataStoreFactory,
  documentLoadUrl: string,
  deltaConnectionServer: ILocalDeltaConnectionServer,
  urlResolver: IUrlResolver,
): Promise<IContainer> {
  const loader: ILoader = createLocalLoader(
    // @ts-ignore
    [[codeDetails, factory]],
    deltaConnectionServer,
    urlResolver,
  );
  return loader.resolve({ url: documentLoadUrl });
}

async function build() {
  let documentId = uuid.v4();
  const documentLoadUrl = `fluid-test://localhost/${documentId}`;

  const deltaConnectionServer = LocalDeltaConnectionServer.create();
  const urlResolver = new LocalResolver();

  const factory = (SlateFluidModel.factory as unknown) as IFluidDataStoreFactory;

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

  return {
    do1: dataObject1,
    do2: dataObject2,
    close: async () => await deltaConnectionServer.webSocketServer.close(),
  };
}

export { build };
