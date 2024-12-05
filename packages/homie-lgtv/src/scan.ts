// The spaces and the newlines are important
const SSDP_STRING = `M-SEARCH * HTTP/1.1
HOST: 239.255.255.250:1900
ST: urn:schemas-upnp-org:device:MediaRenderer:1
MAN: "ssdp:discover"
MX: 2

`;

let cachedEncoder: TextEncoder | undefined;

export async function* scan(
  { timeout: timeoutMs = 10000, signal }: {
    timeout: number;
    signal: AbortSignal;
  },
) {
  const conn = Deno.listenDatagram({
    transport: "udp",
    hostname: "0.0.0.0",
    reuseAddress: true,
    port: 0,
  });

  cachedEncoder ??= new TextEncoder();

  const payload = cachedEncoder.encode(SSDP_STRING);

  conn.send(payload, {
    port: 1900,
    hostname: "239.255.255.250",
    transport: "udp",
  });

  const decoder = new TextDecoder();

  const stopped = new Promise((resolve) => {
    signal?.addEventListener("abort", resolve);
    setTimeout(resolve, timeoutMs);
  });

  const foundDevices = new Set<string>();

  while (true) {
    const [data, addr] = await Promise.race([
      stopped.then(() => []),
      conn.receive(new Uint8Array(512)),
    ]);

    // Stopped
    if (data == null || addr == null) {
      conn.close();
      break;
    }

    const headersStr = decoder.decode(data);

    const headers = Object.fromEntries(
      headersStr.split("\r\n").map((line) => {
        return line.split(": ", 2);
      }),
    );

    const deviceName = headers["DLNADeviceName.lge.com"];
    const id = headers["USN"]?.split(":")[1];

    if (deviceName == null || id == null || foundDevices.has(id)) {
      continue;
    }

    foundDevices.add(id);

    yield {
      name: deviceName,
      hostname: (addr as Deno.NetAddr).hostname,
      id: headers["USN"].split(":")[1],
    };
  }
}
