# WIP

Idea is this:

- Integrate with any mqtt-client
  - Provide adapters for mqtt.js and u8-mqtt.
  - Some environments, like a zigbee2mqtt plugin for example, already has access
    to an mqtt connection.
- Built for Homie v5
- Root device handles connection. Child devices uses connection of root device
- You just write the device description and this library will take care of the
  mqtt stuff

Example

```typescript
const myRootDevice = createDevice('root-device', {

}, mqttAdapter);

myRootDevice.createDevice('child-device', {

});

// The library will register any changes in here and send the required
// messages to the mqtt broker (using immer under the hood)
await myRootDevice.updateDescription((description) => {
  // Modify the description using javascript in here
  devices.nodes['new-node'] = {
    properties: {

    }
  }

  // Or delete a node
  delete device.nodes['some-node'];
});

myRootDevice.onSetCommand((node, property, value) => {
  if (node === '')
  myRootDevice.setValue(node, property, value)
});

myRootDevice.setValue(node, propery, value) => {

});
```
