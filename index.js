const dgram = require("node:dgram");
const dnsPacket = require("dns-packet");
const server = dgram.createSocket("udp4");

const db = {
  "example.com": "1.2.3.4",
  "blog.example.com": "4.5.6.7",
};

server.on("message", (msg, rinfo) => {
  try {
    const incomingReq = dnsPacket.decode(msg);
    const domainName = incomingReq.questions[0]?.name;

    console.log(`Received DNS query for: ${domainName}`);

    const ipFromDb = db[domainName];

    if (!ipFromDb) {
      console.error(`No record found for: ${domainName}`);
      return;
    }

    const ans = dnsPacket.encode({
      type: "response",
      id: incomingReq.id,
      flags: dnsPacket.AUTHORITATIVE_ANSWER,
      questions: incomingReq.questions,
      answers: [
        {
          type: "A",
          class: "IN",
          name: domainName,
          data: ipFromDb,
          ttl: 300,
        },
      ],
    });

    server.send(ans, rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error("Failed to send response:", err);
      } else {
        console.log(
          `Responded to ${rinfo.address}:${rinfo.port} with IP ${ipFromDb}`
        );
      }
    });
  } catch (error) {
    console.error("Error processing DNS request:", error);
  }
});

server.bind(53, () => console.log("DNS Server is running on port 53..."));
