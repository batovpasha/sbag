const { Server } = require('ws');

const TransportBase       = require('../TransportBase');
const Exception           = require('../../exception/Exception');
const EXCEPTION_CODES     = require('../../exception/codes');
const { RESULT_STATUSES } = require('../../constants/statuses');

class WsTransport extends TransportBase {
    static defaultPort = 3000; // eslint-disable-line no-magic-numbers

    static protocolName = 'ws';

    constructor(...args) {
        super(...args);

        this._handleConnection = this._handleConnection.bind(this);
    }

    start() {
        this.server = new Server({ port: this.port });

        this.server.on('connection', this._handleConnection);
    }

    _handleConnection(connection) {
        connection.on('message', message => this._handleMessage(connection, message));
    }

    async _handleMessage(connection, message) {
        try {
            const { entityName, methodName, params = {} } = JSON.parse(message);
            const entity = this.entities[entityName];

            if (!entity) throw new Exception(EXCEPTION_CODES.ENTITY_NOT_FOUND);

            const result = await entity.runMethod(methodName, params);

            connection.send(JSON.stringify({
                status : RESULT_STATUSES.SUCCESS,
                data   : result || {}
            }));
        } catch (err) {
            if (err instanceof Exception) {
                connection.send(JSON.stringify({
                    status : RESULT_STATUSES.ERROR,
                    error  : err
                }));
            } else {
                console.error(err);

                connection.send(JSON.stringify({
                    status : RESULT_STATUSES.ERROR,
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

module.exports = WsTransport;
