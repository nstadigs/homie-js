import { Device } from "react-homie-devices";
import { DiscoveryNode } from "./DiscoveryNode.tsx";

export function ControllerDevice() {
  return (
    <Device id="webos-controller" name="WebOS Devices Controller">
      <DiscoveryNode
        onFound={() => {
        }}
      />
    </Device>
  );
}
