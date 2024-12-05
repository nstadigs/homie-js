const conn = Deno.listenDatagram({
  transport: "udp",
  hostname: "0.0.0.0",
  reuseAddress: true,
  port: 0,
});

const _networkInterfaces = Deno.networkInterfaces().filter(
  ({ address, family }) => {
    if (family !== "IPv4") {
      return false;
    }

    if (/^169\.254\./.test(address)) {
      return false;
    }

    return true;
  },
);

const cachedEncoder = new TextEncoder();

const ssdp_string = `M-SEARCH * HTTP/1.1
HOST: 239.255.255.250:1900
ST: urn:schemas-upnp-org:device:MediaRenderer:1
MAN: "ssdp:discover"
MX: 2

`;

const payload = cachedEncoder.encode(ssdp_string);

for (let i = 0; i < 3; i++) {
  console.log("Sending request...");

  conn.send(payload, {
    port: 1900,
    hostname: "239.255.255.250",
    transport: "udp",
  });

  console.log("Awaiting response...");

  const [data, Addr] = await Promise.race([
    wait(60000).then(() => [null]),
    conn.receive(),
  ]);

  if (data == null) {
    console.log("Timeout");
    continue;
  }

  const decoder = new TextDecoder();
  console.log(decoder.decode(data), Addr);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
