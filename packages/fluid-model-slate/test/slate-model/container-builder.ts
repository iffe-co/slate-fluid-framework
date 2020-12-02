import {
    IContainer,
    IFluidCodeDetails,
    ILoader,
} from '@fluidframework/container-definitions';
import {ContainerRuntimeFactoryWithDefaultDataStore, DataObjectFactory} from "@fluidframework/aqueduct";
import { IUrlResolver } from '@fluidframework/driver-definitions';
import { LocalResolver } from '@fluidframework/local-driver';
import {
    ILocalDeltaConnectionServer,
    LocalDeltaConnectionServer,
} from '@fluidframework/server-local-server';
import {
    createAndAttachContainer,
    createLocalLoader, OpProcessingController,
} from '@fluidframework/test-utils';

import { IFluidDataStoreFactory } from '@fluidframework/runtime-definitions';
import {SlateFluidModel} from "../../src/slate-model";

const codeDetails: IFluidCodeDetails = {
    package: 'localServerTestPackage',
    config: {},
};
const uuid = require('uuid')

async function createContainer(
    factory: IFluidDataStoreFactory,
    documentId: string,
    deltaConnectionServer: ILocalDeltaConnectionServer,
    urlResolver: IUrlResolver,
): Promise<IContainer> {
    const runtimeFactory =
        new ContainerRuntimeFactoryWithDefaultDataStore(
            "default",
            [
                ["default", Promise.resolve(factory)],
            ],
        );

    const loader: ILoader = createLocalLoader(
        [[codeDetails, runtimeFactory]],
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
    const runtimeFactory =
        new ContainerRuntimeFactoryWithDefaultDataStore(
            "default",
            [
                ["default", Promise.resolve(factory)],
            ],
        );

    const loader: ILoader = createLocalLoader(
        [[codeDetails, runtimeFactory]],
        deltaConnectionServer,
        urlResolver,
    );
    return loader.resolve({ url: documentLoadUrl });
}

async function getDefaultObjectFromContainer<T>(container: IContainer) {
    const url = "/";
    const response = await container.request({ url });
    // Verify the response
    if (response.status !== 200 || response.mimeType !== "fluid/object") {
        throw new Error(`Unable to retrieve Fluid object at URL: "${url}"`);
    }
    else if (response.value === undefined) {
        throw new Error(`Empty response from URL: "${url}"`);
    }
    return <T>response.value;
}

async function build() {
    let documentId = uuid.v4();
    const documentLoadUrl = `fluid-test://localhost/${documentId}`;

    const deltaConnectionServer = LocalDeltaConnectionServer.create();
    const urlResolver = new LocalResolver();

    const factory = SlateFluidModel.factory as unknown as IFluidDataStoreFactory

    const container1 = await createContainer(
        factory,
        documentId,
        deltaConnectionServer,
        urlResolver,
    );

    const dataObject1 = await getDefaultObjectFromContainer<SlateFluidModel>(
        container1,
    );

    const container2 = await loadContainer(
        factory,
        documentLoadUrl,
        deltaConnectionServer,
        urlResolver,
    );

    const dataObject2 = await getDefaultObjectFromContainer<SlateFluidModel>(
        container2,
    );

    const opProcessingController = new OpProcessingController(
        deltaConnectionServer,
    );

    opProcessingController.addDeltaManagers(
        dataObject1.runtime.deltaManager,
        dataObject2.runtime.deltaManager,
    );

    return {
        do1: dataObject1,
        do2: dataObject2,
        close: async () => await deltaConnectionServer.webSocketServer.close(),
        sync: async (times: number) => {
            for (let i = 0; i < times; i++) {
                await opProcessingController.process(dataObject1.runtime.deltaManager);
                await opProcessingController.process(dataObject2.runtime.deltaManager);
            }
        },
    };
}

export {build}
