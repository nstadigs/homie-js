import createLgtvClient from "npm:lgtv2";
import { wake } from "jsr:@bukhalo/wol";
import { createRootDevice, MqttAdapter } from "jsr:@nstadigs/homie-devices";
import { webosUris } from "./constants.ts";

// @deno-types="@types/react"
import * as React from "react";
import { DiscoveryNode } from "./components/DiscoveryNode.tsx";

class TestAdapter implements MqttAdapter {
  connect(url: string): Promise<void> {
    console.log("Connecting to MQTT broker");
    return Promise.resolve();
  }

  disconnect(url: string): Promise<void> {
    console.log("Disconnecting from MQTT broker");
    return Promise.resolve();
  }

  subscribe(topic: string): Promise<void> {
    console.log("Subscribing to", topic);
    return Promise.resolve();
  }

  unsubscribe(topic: string): Promise<void> {
    console.log("Unsubscribing from", topic);
    return Promise.resolve();
  }

  publish(
    topic: string,
    payload: string,
    qos: 0 | 1 | 2,
    retained: boolean,
  ): Promise<void> {
    console.log("Pub:", topic, payload);
    return Promise.resolve();
  }

  onMessage(callback: (topic: string, payload: string) => void): () => void {
    console.log("Setting up message callback");
    return () => {
      console.log("Removing message callback");
    };
  }

  onBeforeDisconnect(callback: () => void): void {
    console.log("Setting up before disconnect callback");
  }
}

const devices = {};
