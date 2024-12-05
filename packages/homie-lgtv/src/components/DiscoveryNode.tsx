import { Enum, Integer, Node } from "react-homie-devices";
import { scan } from "../scan.ts";
import { useSyncExternalStore } from "react";

const callbacks = new Set<VoidFunction>();

type Status = "Idle" | "Scanning";
type Device = {
  id: string;
  hostname: string;
  name: string;
};

const store: { status: Status; devices: Map<string, Device> } = {
  status: "Idle",
  devices: new Map<string, Device>(),
};

const {signal, abort} = new AbortController();

async function startScan() {
  store.status = 'Scanning';
  callbacks.forEach((cb) => cb());

  for await (const device of scan({timeout: 10000, signal})) {
    store.devices.set(device.id, device);
    callbacks.forEach((cb) => cb());
  }

  store.status = 'Idle'
  callbacks.forEach((cb) => cb());
}

export type DiscoveryNodeProps = {
  onFound: (device: Device) => void;
};

export function DiscoveryNode({ onFound }: DiscoveryNodeProps) {
  const { status } = useSyncExternalStore(
    (cb) => {
      callbacks.add(cb);

      return () => {
        callbacks.delete(cb);
      };
    },
    () => store,
    () => store,
  );

  return (
    <Node id="discovery">
      <Enum id="status" options={["Idle", "Scanning"]} value={status} />
      <Enum
        id="commands"
        name="Commands"
        retained
        options={["Scan", "Stop"]}
        onSet={(command) => {
          switch (command) {
            case "Scan": {
              startScan();
              return;
            }

            case "Stop": {
              abort();
            }
          }
        }}
      />
      <Integer id="progress" name="Scanning progress" retained 
    </Node>
  );
}
