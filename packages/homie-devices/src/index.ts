import { mqtt_v4, MQTTClient_v4 } from "u8-mqtt";
import { DeviceDescription, DeviceState } from "homie-spec";

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

class Device {
  children: Set<Device> = new Set();
  nodes: Node[] = [];
  state: DeviceState = "init";
  log: string | null = null;

  constructor() {
    this.client = new Client();
  }

  getDesctiption(): DeviceDescription {
    return {
      homie: "5.0",
      version: "1.0.0",
      nodes: this.nodes.reduce((acc, node) => {
        acc[node.id] = node.getAttributes();
        return acc;
      }, {}),
      children: Array.from(this.children).map((child) => child.id),
    };
  }

  createChildDevice(props) {
    this.children.add(child);
  }

  createNode(props) {
    const node = new Node(props);
    this.nodes.push(node);
  }

  announce() {}
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

  addDevice(device: Device) {
    this.children.add(device);
  }
}

export function createRootDevice(url: string) {
  return new RootDevice();
}
