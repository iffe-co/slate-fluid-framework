/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ContainerRuntimeFactoryWithDefaultDataStore, DataObjectFactory,
} from "@fluidframework/aqueduct";

import {SlateFluidModel} from "@solidoc/fluid-model-slate";
import {SharedMap} from "@fluidframework/map";
import {SharedObjectSequence} from "@fluidframework/sequence";
import {FluidDraftJsObject} from "../fluid-object";

/**
 * This does setup for the Fluid Container.
 *
 * There are two important things here:
 * 1. Default FluidObject name
 * 2. Map of string to factory for all FluidObjects
 *
 * In this example, we are only registering a single FluidObject, but more complex examples will register multiple
 * FluidObjects.
 */
export const FluidDraftJsContainer = new ContainerRuntimeFactoryWithDefaultDataStore(
    SlateFluidModel.Name,
    new Map([new DataObjectFactory(
        SlateFluidModel.Name,
        SlateFluidModel,
        [SharedMap.getFactory()],
        {},
    ).registryEntry]),
);
