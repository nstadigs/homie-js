// @deno-types="npm:@types/react"
import React from "react";
import { register } from "./mod.ts";
import type { MqttAdapter, OnMessageCallback } from "@nstadigs/homie-devices";
import { Device, Node, Property } from "./mod.ts";

Deno.test("mod", async () => {
  function Controller() {
    const [someValue, setSomeValue] = React.useState(0);

    return (
      <Device id="root-device" name="Root device">
        <Node id="root-device-node">
          <Property
            id="property-2"
            name="Property 3"
            datatype="integer"
            retained={someValue % 2 === 0}
            onSet={(addValue) => {
              console.log("----------------------- Setting some value");
              setSomeValue((value) => value + addValue);
            }}
          />
        </Node>
      </Device>
    );
  }

  const mqtt = new TestMqttAdapter();

  mqtt.subscribe("+/5/#");

  mqtt.onMessage((topic, payload) => {
    console.log("Sent message", topic, payload);
  });

  const cleanUp = register(
    <Controller />,
    mqtt,
  );

  await new Promise((resolve) => setTimeout(resolve, 1));

  mqtt.publish(
    "homie/5/root-device/root-device-node/property-2/set",
    "42",
    0,
    false,
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

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
