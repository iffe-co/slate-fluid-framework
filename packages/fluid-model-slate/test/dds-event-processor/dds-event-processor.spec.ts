import {
  bindFluidNodeEvent,
  registerOperationReceiver,
} from '../../src/dds-event-processor/binder';

import { buildNetSharedMap } from './networked-dds-builder';

describe('dds event processor', () => {
  describe('shared map value changed event', () => {
    let operationReceiverMock: any;
    beforeEach(() => {
      operationReceiverMock = jest.fn();
    });

    it('should trigger operation receiver with set node op when obtain a set SharedMap op', async () => {
      const {
        maps: [map, map2],
        sendMessage,
      } = await buildNetSharedMap();

      registerOperationReceiver(operationReceiverMock);
      bindFluidNodeEvent(map);

      map2.set('newKey', 'new value');
      sendMessage();

      expect(operationReceiverMock).toBeCalledWith({
        newProperties: { key: 'new value' },
        path: [],
        properties: { key: 'new value' },
        type: 'set_node',
      });
    });
  });
});
