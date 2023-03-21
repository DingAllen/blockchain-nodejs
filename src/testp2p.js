const dgram = require('dgram');

const udp = dgram.createSocket('udp4');

udp.on('message', (msg, rinfo) => {
    console.log(`server got: ${msg} \nfrom ${rinfo.address}:${rinfo.port}`);
});
udp.on('listening', () => {
    const address = udp.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

udp.bind(0);

const send = (msg, port, host) => {
    console.log(`client send: ${msg} \nto ${host}:${port}`);
    udp.send(Buffer.from(msg), port, host);
}

const port = Number(process.argv[2]);
const host = process.argv[3];

if (port && host) {
    send('hello', port, host);
}
