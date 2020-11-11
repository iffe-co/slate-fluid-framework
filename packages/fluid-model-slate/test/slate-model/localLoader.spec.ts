Object.defineProperty(window, 'performance', {
    value: undefined,
    writable: false,
});

import { IContainer, IFluidCodeDetails, ILoader } from "@fluidframework/container-definitions";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { IUrlResolver } from "@fluidframework/driver-definitions";
import { LocalResolver } from "@fluidframework/local-driver";
import { IFluidDataStoreFactory } from "@fluidframework/runtime-definitions";
import { requestFluidObject } from "@fluidframework/runtime-utils";
import { SharedString} from "@fluidframework/sequence";
import { LocalDeltaConnectionServer, ILocalDeltaConnectionServer } from "@fluidframework/server-local-server";
import {
    createAndAttachContainer,
    createLocalLoader,
    OpProcessingController,
} from "@fluidframework/test-utils";
import {SharedMap} from "@fluidframework/map";
import {SlateFluidModel} from "../../src";

describe("LocalLoader", () => {
    const documentId = "localLoaderTest";
    const documentLoadUrl = `fluid-test://localhost/${documentId}`;
    const codeDetails: IFluidCodeDetails = {
        package: "localLoaderTestPackage",
        config: {},
    };

    let deltaConnectionServer: ILocalDeltaConnectionServer;
    let urlResolver: IUrlResolver;
    let opProcessingController: OpProcessingController;

    async function createContainer(factory: IFluidDataStoreFactory): Promise<IContainer> {
        const loader: ILoader = createLocalLoader([[codeDetails, factory]], deltaConnectionServer, urlResolver);
        return createAndAttachContainer(documentId, codeDetails, loader, urlResolver);
    }

    async function loadContainer(factory: IFluidDataStoreFactory): Promise<IContainer> {
        const loader: ILoader = createLocalLoader([[codeDetails, factory]], deltaConnectionServer, urlResolver);
        return loader.resolve({ url: documentLoadUrl });
    }

    describe("2 dataObjects", () => {
        beforeEach(async () => {
            deltaConnectionServer = LocalDeltaConnectionServer.create();
            urlResolver = new LocalResolver();
            opProcessingController = new OpProcessingController(deltaConnectionServer);
        });

        afterEach(async () => {
            await deltaConnectionServer.webSocketServer.close();
        });

        it.skip("late open / early close", async () => {
            const container1 = await createContainer(SlateFluidModel.factory);
            const dataObject1 = await requestFluidObject<SlateFluidModel>(container1, "default");

            const container2 = await loadContainer(SlateFluidModel.factory);
            const dataObject2 = await requestFluidObject<SlateFluidModel>(container2, "default");

            opProcessingController.addDeltaManagers(
                dataObject1.runtime.deltaManager,
                dataObject2.runtime.deltaManager);

            let sharedMap = SharedMap.create(dataObject1.runtime);
            let value = SharedString.create(dataObject1.runtime);
            value.insertText(0, '111')
            sharedMap.set('x', value.handle)

            let sharedMap2 = SharedMap.create(dataObject1.runtime);
            let value2 = SharedString.create(dataObject1.runtime);
            value2.insertText(0, '222')
            sharedMap2.set('x', value2.handle)

            dataObject1.getDocContentAndProperties().content.insert(0, [<IFluidHandle<SharedMap>>sharedMap.handle, <IFluidHandle<SharedMap>>sharedMap2.handle])
            await opProcessingController.process();
            await opProcessingController.process();
            await opProcessingController.process();
            await opProcessingController.process();

            let fluidNodeIFluidHandle = dataObject1.getDocContentAndProperties().content.getRange(0, 2)[1];
            let node_0 = await fluidNodeIFluidHandle.get();
            let newVar = await node_0.get('x').get();
            expect(newVar.getText()).toEqual('222')
        });
    });
});
