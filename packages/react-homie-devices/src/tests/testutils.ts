import type { MqttAdapter, OnMessageCallback } from "@nstadigs/homie-adapter";

export type MqttEvent = {
  topic: string;
  payload: string;
  qos: 0 | 1 | 2;
  retained: boolean;
};

export class TestMqttAdapter implements MqttAdapter {
  messageCallbacks: Set<OnMessageCallback> = new Set();

  events: MqttEvent[] = [];

  subscribedTopics = new Set<string>();

  reset() {
    this.messageCallbacks.clear();
    this.subscribedTopics.clear();
    this.events = [];
  }

  connect() {
    return Promise.resolve();
  }

  disconnect() {
    return Promise.resolve();
  }

  subscribe(topicPattern: string) {
    this.subscribedTopics.add(topicPattern);
    return Promise.resolve();
  }

  unsubscribe(topicPattern: string) {
    this.subscribedTopics.delete(topicPattern);
    return Promise.resolve();
  }

  publish(topic: string, payload: string, qos: 0 | 1 | 2, retained: boolean) {
    this.events.push({ topic, payload, qos, retained });

    this.messageCallbacks.forEach((callback) => {
      if (
        [...this.subscribedTopics].some((topicPattern) =>
          matchesMqttTopicPattern(topic, topicPattern)
        )
      ) {
        callback(topic, payload);
      }
    });
    return Promise.resolve();
  }

  onMessage(callback: OnMessageCallback) {
    this.messageCallbacks.add(callback);

    return () => {
      this.messageCallbacks.delete(callback);
    };
  }
}

function matchesMqttTopicPattern(topic: string, topicPattern: string) {
  const patternParts = topicPattern.split("/");
  const topicParts = topic.split("/");

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] === "#") {
      return true;
    }

    if (patternParts[i] === "+") {
      continue;
    }

    if (patternParts[i] !== topicParts[i]) {
      return false;
    }
  }

  return patternParts.length === topicParts.length;
}