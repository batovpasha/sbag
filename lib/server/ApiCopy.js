const fs  = require('fs/promises');
const path = require('path');
const Ajv = require('ajv');

const Entity        = require('./Entity');
const TransportBase = require('./transports/TransportBase');
const HttpTransport = require('./transports/default/HttpTransport');
const WsTransport   = require('./transports/default/WsTransport');

class ApiCopy {
    constructor(structure, { transport = 'http', port, schemaOutDir } = {}) {
        this.structure = structure;
        this.entities = this.initEntities(structure);
        this.schemaOutDir = schemaOutDir;
        this.defaultTransports = {
            http : new HttpTransport(this.entities, { port }),
            ws   : new WsTransport(this.entities, { port })
        };

        if (
            !(transport instanceof TransportBase) &&
            (typeof transport === 'string' && !Object.keys(this.defaultTransports).includes(transport))
        ) {
            throw new TypeError('transport should be instance of TransportBase class ' +
                                `or one of the next strings: ${Object.keys(this.defaultTransports)}`);
        }

        this.transport = transport instanceof TransportBase ? transport : this.defaultTransports[transport];
    }

    initEntities(structure) {
        const validator = new Ajv({
            removeAdditional : 'all',
            allErrors        : true,
            coerceTypes      : true
        });

        return Object
            .entries(structure)
            .reduce((acc, [ entityName, entityMethods ]) => ({
                ...acc,
                [entityName] : new Entity(entityName, entityMethods, { validator })
            }), {});
    }

    async start() {
        const schema = this.generateScheme();

        await this.writeSchema(schema);

        this.transport.start();
    }

    generateScheme() {
        const schema = {
            transport : this.transport.getProtocolName(),
            structure : Object
                .entries(this.structure)
                .reduce((accEntities, [ entityName, methods ]) => {
                    // eslint-disable-next-line no-param-reassign
                    accEntities[entityName] = Object
                        .entries(methods)
                        .map(([ methodName, methodClass ]) => ({
                            method      : methodName,
                            description : methodClass.description,
                            params      : methodClass.validationRules
                        }));

                    return accEntities;
                }, {})
        };

        return schema;
    }

    async writeSchema(schema) {
        const schemaFilePath = path.join(this.schemaOutDir, 'schema.json');
        const schemaJsonString = JSON.stringify(schema, null, 2);

        await fs.writeFile(schemaFilePath, schemaJsonString);
    }
}

module.exports = ApiCopy;
