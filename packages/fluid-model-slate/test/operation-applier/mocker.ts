import * as mocks from '@fluidframework/test-runtime-utils';
import {
  SharedObjectSequence,
  SharedObjectSequenceFactory,
  SharedString,
  SharedStringFactory,
} from '@fluidframework/sequence';
import { SharedMap } from '@fluidframework/map';
const uuid = require('uuid');

export const mockRuntime: mocks.MockFluidDataStoreRuntime = new mocks.MockFluidDataStoreRuntime();

const originalDdsCreate = {
  shareString: SharedString.create,
  sharedMap: SharedMap.create,
  sharedObjectSequence: SharedObjectSequence.create,
};
export const mockDdsCreate = () => {
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
};

export const restoreDdsCreate = () => {
  SharedString.create = originalDdsCreate.shareString;
  SharedMap.create = originalDdsCreate.sharedMap;
  SharedObjectSequence.create = originalDdsCreate.sharedObjectSequence;
};
