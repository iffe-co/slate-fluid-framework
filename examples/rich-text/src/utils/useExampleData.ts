/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useState, useEffect } from 'react';
import { getDefaultObjectFromContainer } from '@fluidframework/aqueduct';
import { Container } from '@fluidframework/container-loader';
import { SlateFluidModel } from '@solidoc/fluid-model-slate';
import {
  createAndAttachContainer,
  createLocalLoader,
} from '@fluidframework/test-utils';
import { LocalDeltaConnectionServer } from '@fluidframework/server-local-server';
import { LocalResolver } from '@fluidframework/local-driver';

export const useExampleData = (id, isNew) => {
  const [context, setContext] = useState(undefined);
  const [context2, setContext2] = useState(undefined);
  let defaultObject = undefined;
  let defaultObject2 = undefined;
  useEffect(() => {
    // Create an scoped async function in the hook
    let container: Container | undefined;
    let container2: Container | undefined;
    async function loadContainer() {
      try {
        const documentId = 'localLoaderTest';
        const documentLoadUrl = 'http://localhost:3000/localLoaderTest';
        const codeDetails = {
          package: 'localLoaderTestPackage',
          config: {},
        };
        const deltaConnectionServer = LocalDeltaConnectionServer.create();
        const urlResolver = new LocalResolver();
        const loader = await createLocalLoader(
          [[codeDetails, SlateFluidModel.factory]],
          deltaConnectionServer,
          urlResolver,
        );
        // @ts-ignore
        container = await createAndAttachContainer(
          documentId,
          codeDetails,
          loader,
          urlResolver,
        );
        defaultObject = await getDefaultObjectFromContainer<SlateFluidModel>(
          container,
        );

        const loader2 = await createLocalLoader(
          [[codeDetails, SlateFluidModel.factory]],
          deltaConnectionServer,
          urlResolver,
        );
        // @ts-ignore
        container2 = await loader2.resolve({ url: documentLoadUrl });
        defaultObject2 = await getDefaultObjectFromContainer<SlateFluidModel>(
          container2,
        );
        setContext(defaultObject);
        setContext2(defaultObject2);
      } catch (e) {
        console.log(e);
        // Something went wrong
        // Navigate to Error page
      }
    }
    loadContainer();
    return () => {
      // If we are unloading and the Container has been generated we want to
      // close it to ensure we are not leaking memory
      if (container !== undefined) {
        container.close();
        container2.close();
      }
    };
  }, []);
  return [context, context2];
};
