# WIP

Idea is this:

- Integrate with any mqtt-client
  - Some environments, like a zigbee2mqtt plugin for example, already has access to an mqtt connection.
- Local cache (with storage adapter?)
- Keep track of subscriptions
- Return native JS async iterables
  - One can easily integrate with RxJS with `from(myIterable)`
- Query like an ORM

Something like this:

```javascript
// .values gives async iterable
const values = client.find({ datatype: "duration" }).values;

for await (const { device, node, property, value } of values) {
  console.log({ device, node, property, value });
}

// .subscribe for callbacks
const unsubscribe = client
  .findMany({ datatype: "duration" })
  .subscribe(({ device, node, property, value }) => {
    console.log({ device, node, property, value });
  });
```
