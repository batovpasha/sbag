class TransportBase {
    constructor(entities, { port = this.constructor.defaultPort } = {}) {
        this.entities = entities;
        this.port = port;
        this.server = null;
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
