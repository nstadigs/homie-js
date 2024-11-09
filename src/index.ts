import { mqtt_v4, MQTTClient_v4 } from "u8-mqtt";

export type DeviceState =
  // this is the state the device is in when it is connected to the MQTT broker,
  // but has not yet sent all Homie messages and is not yet ready to operate.
  // This state is optional and may be sent if the device takes a long time to initialize,
  // but wishes to announce to consumers that it is coming online.
  // A device may fall back into this state to do some reconfiguration.
  | "init"

  // this is the state the device is in when it is connected to the MQTT broker
  // and has sent all Homie messages describing the device attributes, nodes, properties,
  // and their values. The device has subscribed to all appropriate /set topics and is
  // ready to receive messages.
  | "ready"

  // this is the state the device is in when it is cleanly disconnected from the MQTT broker.
  // You must send this message before cleanly disconnecting.
  | "disconnected"

  //  this is the state the device is in when the device is sleeping. You have to send this
  // message before sleeping.
  | "sleeping"

  // this is the state the device is in when the device has been “badly” disconnected.
  // Important: If a root-device $state is "lost" then the state of every child device in its tree is also "lost". You must define this message as the last will (LWT) for root devices.
  | "lost";

export type DeviceAttributes = {
  $state: DeviceState;
  $description: DeviceDescription;
  $log: string;
};

// Comments are taken from the spec
export type DeviceDescription = {
  // The implemented Homie convention version, without the “patch” level.
  // So the format is "5.x", where the 'x' is the minor version.
  homie: `${number}.${number}`;

  //The version of the description document. Whenever the document changes,
  // a new version must be assigned. This does not need to be sequential,
  // eg. a timestamp or a random number could be used.
  version: string;

  // The Nodes the device exposes. An object containing the Nodes,
  // indexed by their ID. Defaults to an empty object.
  nodes?: Record<string, any>; // TODO

  // Friendly name of the device. Defaults to the ID of the device.
  name?: string;

  // Type of Device. Please ensure proper namespacing to prevent naming collisions.
  type?: string;

  // Array of ID’s of child devices. Defaults to an empty array.
  children?: string[];

  // ID of the root parent device. Required if the device is NOT the root device,
  // MUST be omitted otherwise.
  root?: string;

  // ID of the parent device. Required if the parent is NOT the root device.
  // Defaults to the value of the root property.
  parent?: string;

  // Array of supported extensions. Defaults to an empty array.
  extensions?: string[];
};

export type NodeAttributes = {
  name: string;
  type: string;
  properties: string;
};

class Client {
  private mqtt: MQTTClient_v4;

  constructor() {
    this.mqtt = mqtt_v4({});
  }

  connect() {
    this.mqtt.connect("ws://localhost:8080/mqtt");
  }

  subscribe() {
    this.mqtt.subscribe_topic("my_topic");
  }

  onSub() {
    this.mqtt.on_sub((topic: string, payload: string) => {
      console.log(`Received message from ${topic}: ${payload}`);
    });
  }
}

class Property {}

class Node {}

class Device {
  children: Set<Device> = new Set();
  nodes: Node[] = [];
  state: DeviceState = "init";
  log: string | null = null;

  constructor() {
    this.client = new Client();
  }

  createChild(props) {
    this.children.add(child);
  }
}

class RootDevice extends Device {
  client: Client;

  constructor() {
    super();

    this.client = new Client();
  }

  start() {
    this.client.connect();
    this.client.subscribe();
    this.client.onSub();
  }
}

export function createRootDevice() {
  return new RootDevice();
}
