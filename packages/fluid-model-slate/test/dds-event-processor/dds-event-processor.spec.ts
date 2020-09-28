import { Operation } from 'slate';

import {
  bindFluidNodeEvent,
  registerOperationReceiver,
} from '../../src/dds-event-processor/binder';

import { buildNetSharedMap } from './networked-dds-builder';

describe('dds event processor', () => {
  describe('shared map value changed event', () => {
    it('should trigger operation receiver with set node op when obtain a set SharedMap op', async () => {
      const {
        maps: [map, map2],
        sendMessage,
      } = await buildNetSharedMap();
      registerOperationReceiver((op: Operation) => {
        expect(op.type).toEqual('set_node1');
        expect((op as any).properties.key).toEqual('new value');
        expect((op as any).newProperties.key).toEqual('new value');
      });
      bindFluidNodeEvent(map);
      map2.set('newKey', 'new value');
      sendMessage();
    });
  });
});
