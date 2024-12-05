const callbacks = new Set<() => void>();

function notify() {
  callbacks.forEach((cb) => cb());
}

export type Device = {
  id: string;
  hostname: string;
  name: string;
};

export const devices = new Map<string, Device>();

export function addDevice(device: Device) {
  devices.set(device.id, device);
  notify();
}

export function onChange(cb: () => void) {
  callbacks.add(cb);

  return () => {
    callbacks.delete(cb);
  };
}
