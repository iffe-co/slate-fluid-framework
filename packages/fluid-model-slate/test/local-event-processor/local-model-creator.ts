import { LocalResolver } from '@fluidframework/local-driver';
import { LocalDeltaConnectionServer } from '@fluidframework/server-local-server';
import { requestFluidObject } from '@fluidframework/runtime-utils';
import { createAndAttachContainer, createLocalLoader } from '@fluidframework/test-utils';
import { IFluidCodeDetails } from '@fluidframework/core-interfaces';
import { SlateFluidModel } from '../../src';

export const createLocalModel = async <T>(src: string, doFactory: any ): Promise<{model: T, disconnect: () => {}}> => {
  const codeDetails: IFluidCodeDetails = {
    package: 'databaseTestPkg',
    config: {},
  };
  const deltaConnectionServer = LocalDeltaConnectionServer.create();
  const urlResolver = new LocalResolver();
  const loader = createLocalLoader([[codeDetails, doFactory]] as any, deltaConnectionServer, urlResolver);
  const container = await createAndAttachContainer(src, codeDetails, loader, urlResolver);
  const model = await requestFluidObject<T>(container, 'default');
  return {model, disconnect: () => deltaConnectionServer.webSocketServer.close()}
};