class TransportBase {
    constructor(entities, { server, port = this.constructor.defaultPort } = {}) {
        this.entities = entities;
        this.server = server;
        this.port = port;
        this.protocolName = this.constructor.protocolName;
    }

    getPort() {
        return this.port;
    }

    getProtocolName() {
        return this.protocolName;
    }

    start() {
        throw new Error('method "start" should be implemented');
    }
}

module.exports = TransportBase;
