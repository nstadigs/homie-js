import { mqtt_v5, MQTTClient_v5 } from "u8-mqtt";
import { DeviceDescription, DeviceState } from "homie-spec";

class Client {
  private mqtt: MQTTClient_v5;

  constructor() {
    this.mqtt = mqtt_v5({});
  }

  connect(url: string) {
    if (url.startsWith("ws")) {
      this.mqtt.with_websock(url);
    } else if (url.startsWith("mqtts")) {
      this.mqtt.with_tls(url);
    } else if (url.startsWith("mqtt")) {
      this.mqtt.with_tcp(url);
    } else {
      throw new Error("Not supported");
    }

    this.mqtt.connect("ws://localhost:8080/mqtt");
  }

  subscribe(topic: string, callback: (topic: string, payload: string) => void) {
    this.mqtt.subscribe_topic(topic, callback);

    return () => {
      this.mqtt.unsubscribe_topic(topic, callback);
  }
}

class Device {
  children: Set<Device> = new Set();
  nodes: Node[] = [];
  state: DeviceState = "init";
  log: string | null = null;

  constructor() {}

  get description(): DeviceDescription {
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
