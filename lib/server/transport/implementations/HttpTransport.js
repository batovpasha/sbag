const http = require('http');

const TransportBase   = require('../TransportBase');
const Exception       = require('../../exception/Exception');
const EXCEPTION_CODES = require('../../exception/codes');

class HttpTransport extends TransportBase {
    static defaultPort = 8000; // eslint-disable-line no-magic-numbers

    static protocolName = 'http';

    constructor(entities, { port } = {}) {
        const server = http.createServer((req, res) => this._handleRequest(req, res));

        super(entities, { server, port });
    }

    async receiveBody(req) {
        const buffers = [];

        for await (const chunk of req) buffers.push(chunk);

        const data = Buffer.concat(buffers).toString();

        return JSON.parse(data);
    }

    start() {
        this.server.listen(this.port);
    }

    async _handleRequest(req, res) {
        try {
            // configure CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');

            if (req.method === 'OPTIONS') return res.end();

            const { url } = req;
            const [ entityName, methodName ] = url.substring(1).split('/');
            const entity = this.entities[entityName];

            if (!entity) throw new Exception(EXCEPTION_CODES.ENTITY_NOT_FOUND);

            const params = await this.receiveBody(req);
            const result = await entity.runMethod(methodName, params);

            res.end(JSON.stringify({
                status : 1,
                data   : result || {}
            }));
        } catch (err) {
            if (err instanceof Exception) {
                res.end(JSON.stringify({
                    status : 0,
                    error  : err
                }));
            } else {
                console.error(err);

                res.end(JSON.stringify({
                    status : 0,
                    error  : {
                        code    : 'SERVER_ERROR',
                        message : 'Server error occurs',
                        fields  : []
                    }
                }));
            }
        }
    }
}

module.exports = HttpTransport;