import {
  createRootDevice,
  type MqttAdapter,
  type OnMessageCallback,
} from "./index.ts";

class TestMqttAdapter implements MqttAdapter {
  #messageCallbacks: Set<OnMessageCallback> = new Set();

  connect() {
    console.log("Connecting to MQTT broker");
    return Promise.resolve();
  }

  disconnect() {
    console.log("Disconnecting from MQTT broker");
    return Promise.resolve();
  }

  subscribe(topic: string) {
    console.log(`Subscribing to ${topic}`);
    return Promise.resolve();
  }

  unsubscribe(topic: string) {
    console.log(`Unsubscribing from ${topic}`);
    return Promise.resolve();
  }

  publish(topic: string, payload: string) {
    console.log(`Publishing to ${topic}: ${payload}`);
    return Promise.resolve();
  }

  onMessage(callback: OnMessageCallback) {
    console.log("Setting up message handler");
    this.#messageCallbacks.add(callback);

    return () => {
      console.log("Removing message handler");
      this.#messageCallbacks.delete(callback);
    };
  }

  onBeforeDisconnect(callback: VoidFunction) {
    console.log("Setting up before disconnect handler");
  }
}

const tvController = createRootDevice(
  "lg-tv",
  {
    name: "WebOS TV Controller",
    nodes: {
      system: {
        properties: {
          volume: {
            name: "Volume",
            datatype: "integer",
            format: "0:100",
            settable: true,
            retained: true,
            unit: "%",
          },
          volume_up: {
            name: "Volume Up",
            datatype: "boolean",
            settable: true,
            retained: false,
          },
          volume_down: {
            name: "Volume Down",
            datatype: "boolean",
            settable: true,
            retained: false,
          },
        },
      },
      tv: {
        properties: {
          muted: {
            name: "Muted",
            datatype: "boolean",
            format: "yes,no",
            retained: true,
            settable: true,
          },
          button: {
            name: "Button",
            datatype: "enum",
            format: "up,down,left,right,ok,back,home",
            retained: false,
            settable: true,
          },
        },
      },
    },
  },
  new TestMqttAdapter()
);

tvController.announce();
