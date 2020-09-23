import { SharedObject } from '@fluidframework/shared-object-base';
const addEventListenerHandler = (...ddsArray: SharedObject[]) => {
  ddsArray?.forEach(dds => {
    dds.on('op', () => {});
  });
};

export { addEventListenerHandler };
