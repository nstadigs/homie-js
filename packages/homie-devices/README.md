# WIP

Idea is this:

- Integrate with any mqtt-client
  - Provide adapters for mqtt.js and u8-mqtt.
  - Some environments, like a zigbee2mqtt plugin for example, already has access to an mqtt connection.
- Built for Homie v5
- Root device keeps handles connection. Child devices uses connection of root device
