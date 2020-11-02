import {ContainerRuntimeFactoryWithDefaultDataStore, getDefaultObjectFromContainer} from "@fluidframework/aqueduct";
import {v4} from "uuid"
import {SlateFluidModel} from "@solidoc/fluid-model-slate";
import {getTinyliciousContainer} from "./getTinyliciousContainer";

const Container = new ContainerRuntimeFactoryWithDefaultDataStore(
    SlateFluidModel.Name,
    // @ts-ignore
    new Map([SlateFluidModel.factory.registryEntry]),
);

export async function getSlateModel(documentId?: string) {
    const id = documentId || v4()
    const isNew = !documentId
    const container = await getTinyliciousContainer(
        id,
        Container,
        isNew,
    );
    const model = await getDefaultObjectFromContainer<SlateFluidModel>(
        container,
    );
    const initValue = model.currentSlateValue();
    return {model, initValue, id}
}
