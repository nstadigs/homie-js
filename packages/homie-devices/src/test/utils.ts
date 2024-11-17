import type { OnMessageCallback } from "../index";
import type { MqttAdapter } from "../MqttAdapter";

export class TestMqttAdapter implements MqttAdapter {
  messageCallbacks: Set<OnMessageCallback> = new Set();

  events: {
    topic: string;
    payload: string;
    qos: 0 | 1 | 2;
    retained: boolean;
  }[] = [];

  subscribedTopics = new Set<string>();

  reset() {
    this.messageCallbacks.clear();
    this.subscribedTopics.clear();
    this.events = [];
  }

  connect() {
    console.log("Connecting to MQTT broker");
    return Promise.resolve();
  }

  disconnect() {
    console.log("Disconnecting from MQTT broker");
    return Promise.resolve();
  }

  subscribe(topic: string) {
    this.subscribedTopics.add(topic);
    return Promise.resolve();
  }

  unsubscribe(topic: string) {
    this.subscribedTopics.delete(topic);
    return Promise.resolve();
  }

  publish(topic: string, payload: string, qos: 0 | 1 | 2, retained: boolean) {
    this.events.push({ topic, payload, qos, retained });
    return Promise.resolve();
  }

  onMessage(callback: OnMessageCallback) {
    this.messageCallbacks.add(callback);

    return () => {
      this.messageCallbacks.delete(callback);
    };
  }

  onBeforeDisconnect(callback: VoidFunction) {
    console.log("Setting up before disconnect handler");
  }
}
