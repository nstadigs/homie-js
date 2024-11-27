import React from "react";
import { register } from "./mod.ts";
import type { MqttAdapter, OnMessageCallback } from "@nstadigs/homie-devices";
import { Device, Node, Property } from "./mod.ts";

Deno.test("mod", async () => {
  function Controller() {
    const [someValue, setSomeValue] = React.useState(0);

    React.useEffect(() => {
      const timeoutId = setTimeout(() => {
        console.log("-------------------------- timeout");
        setSomeValue(someValue + 1);
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
      };
    });

    return (
      <>
        <Device id="root-device">
          <Device id={`child-device-${someValue}`}>
            <Device id="third-level-device" />
            {someValue !== 1 && <Node id="some-other-node1" />}
            {someValue === 1 && <Node id="some-other-node2" />}
          </Device>
          <Node id="some-node" type="my-node">
            <Property id="some-property" datatype="string" />
            <Property id="some-other-property" datatype="integer" />
          </Node>
        </Device>
        <Device id="another-root-device" />
      </>
    );
  }

  const cleanUp = register(
    <Controller />,
    new TestMqttAdapter(),
  );

  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log("----------------------- Unregistering");

  cleanUp();
});

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

  onBeforeDisconnect(callback: VoidFunction) {
    console.log("Setting up before disconnect handler");
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
