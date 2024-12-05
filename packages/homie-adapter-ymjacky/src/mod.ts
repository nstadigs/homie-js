import type { MqttAdapter, OnMessageCallback } from "@nstadigs/homie-adapter";
import { type ClientTypes, MqttClient } from "@ymjacky/mqtt5";

const decoder = new TextDecoder();

class MqttAdapterImpl implements MqttAdapter {
  #client?: MqttClient;
  #options: ClientTypes.ClientOptions;

  constructor(options: ClientTypes.ClientOptions) {
    this.#options = options;
  }

  async connect() {
    if (this.#client) {
      await this.#client.disconnect();
    }

    this.#client = new MqttClient(this.#options);
    await this.#client.connect();
  }

  async disconnect() {
    return await this.#client?.disconnect();
  }

  async subscribe(topic: string) {
    await this.#client?.subscribe(topic);
  }

  async unsubscribe(topic: string) {
    await this.#client?.unsubscribe(topic);
  }

  async publish(
    topic: string,
    payload: string,
    qos: 0 | 1 | 2,
    retained: boolean,
  ) {
    await this.mqtt.publish(topic, payload, qos, retained);
  }

  onMessage(callback: OnMessageCallback) {
    const handlePublishEvent = (
      event: { detail: { topic: string; payload: Uint8Array } },
    ) => {
      const packet = event.detail;
      const receiveMessage = decoder.decode(packet.payload);
      callback(packet.topic, receiveMessage);
    };

    this.#client?.on("publish", handlePublishEvent);

    return () => {
      this.#client?.off("publish", handlePublishEvent);
    };
  }

  onBeforeDisconnect(callback: () => void) {
    this.;
  }
}

export { MqttAdapterImpl as MqttAdapter };
