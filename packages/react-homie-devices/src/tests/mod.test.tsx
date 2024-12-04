import { assertEquals } from "jsr:@std/assert";

// @deno-types="npm:@types/react"
import React, { act, useState } from "react";
import { Device, Node, Property, register } from "../mod.ts";
import type { MqttAdapter, OnMessageCallback } from "@nstadigs/homie-adapter";

Deno.test("Initial render", async () => {
  const mqtt = new TestMqttAdapter();

  mqtt.subscribe("+/5/#");

  // deno-lint-ignore require-await
  const cleanUp = await act(async () => {
    return register(<Controller />, mqtt);
  });

  assertEquals(mqtt.events, [
    {
      payload: "init",
      qos: 2,
      retained: true,
      topic: "homie/5/root-device/$state",
    },
    {
      payload: JSON.stringify(
        {
          "homie": "5.0",
          "version": 1285552645,
          "name": "Root device",
          "children": [],
          "nodes": {
            "root-device-node": {
              "name": "root-device-node",
              "properties": {
                "property-2": {
                  "name": "Property 3",
                  "datatype": "integer",
                  "settable": true,
                },
              },
            },
          },
        },
        null,
        2,
      ),
      qos: 2,
      retained: true,
      topic: "homie/5/root-device/$description",
    },
    {
      payload: "ready",
      qos: 2,
      retained: true,
      topic: "homie/5/root-device/$state",
    },
  ]);

  // // Should not trigger description update, since retained will be the same
  // mqtt.publish(
  //   "homie/5/root-device/root-device-node/property-2/set",
  //   "42",
  //   0,
  //   false,
  // );

  // await new Promise((resolve) => setTimeout(resolve, 1000));

  // console.log("----------------------- Unregistering");

  await act(cleanUp);
});

Deno.test("Set same value and target", async () => {
  const mqtt = new TestMqttAdapter();

  mqtt.subscribe("+/5/#");

  // deno-lint-ignore require-await
  const cleanUp = await act(async () => {
    return register(<Controller />, mqtt);
  });

  mqtt.events = [];

  await act(() => {
    mqtt.publish(
      "homie/5/root-device/root-device-node/property-2/set",
      "0",
      0,
      false,
    );
  });

  assertEquals(mqtt.events, []);

  await act(cleanUp);
});

Deno.test("Set new value and target", async () => {
  const mqtt = new TestMqttAdapter();

  mqtt.subscribe("+/5/#");

  // deno-lint-ignore require-await
  const cleanUp = await act(async () => {
    return register(<Controller />, mqtt);
  });

  mqtt.events = [];

  await act(() => {
    mqtt.publish(
      "homie/5/root-device/root-device-node/property-2/set",
      "41",
      0,
      false,
    );
  });

  assertEquals(mqtt.events, [
    {
      topic: "homie/5/root-device/root-device-node/property-2/set",
      payload: "41",
      qos: 0,
      retained: false,
    },
    {
      topic: "homie/5/root-device/root-device-node/property-2",
      payload: "41",
      qos: 2,
      retained: false,
    },
    {
      topic: "homie/5/root-device/root-device-node/property-2/$target",
      payload: "41",
      qos: 2,
      retained: false,
    },
  ]);

  await act(cleanUp);
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

function Controller() {
  const [someValue, setSomeValue] = useState(0);

  return (
    <Device id="root-device" name="Root device">
      <Node id="root-device-node">
        <Property
          id="property-2"
          name="Property 3"
          datatype="integer"
          onSet={(addValue) => {
            setSomeValue((value) => value + addValue);
          }}
          value={someValue}
          target={someValue}
        />
      </Node>
    </Device>
  );
}
