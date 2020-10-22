# Slate-fluid-example

An example for slate-fluid-example.

## Getting Started

To run this follow the steps below:

1. Run `yarn` from the folder root
2. **Modify some code in node_modules**
3. Run `yarn start` from current folder
4. Navigate to `http://localhost:8080` in a browser tab

## Code need add into node_modules

add flow up code into **node_modules/lodash/_arrayEach.js**
```
  array = array.filter(k => k !== 'initialMessages' &&k !== 'routeContext')
```

replace **sendPending()** in **node_modules/@fluidframework/server-lambdas/dist/broadcaster/lambda.js**
```
sendPending() {
    // If there is work currently being sent or we have no pending work return early
    if (this.pending.size === 0) {
        return;
    }

    // Invoke the next send after a setImmediate to give IO time to create more batches
    setImmediate(() => {
        const batchOffset = this.pendingOffset;

        this.current = this.pending;
        this.pending = new Map()

        // Process all the batches + checkpoint
        this.current.forEach((batch, topic) => {
            this.publisher.to(topic).emit(batch.event, batch.documentId, batch.messages);
        });

        this.context.checkpoint(batchOffset);
        this.current.clear();
        this.sendPending();
    });
}
```

add flow up code into **node_modules/@fluidframework/container-loader/lib/deltaManager.js**, put code into import section and the line 870
```
import {ddsChangesQueue} from "@solidoc/fluid-model-slate"
```
```
if (messages.every(m => m.type === 'op')) {
    let milliseconds = new Date().getMilliseconds();
    console.log('enqueueMessages ', messages.map(m => m.type).join(', '), milliseconds)
    ddsChangesQueue.startRecord(milliseconds)
    process.nextTick(async () => {
        await ddsChangesQueue.applyAsyncOps(milliseconds)
        console.log('nextTick ', milliseconds)
    })
}
```
