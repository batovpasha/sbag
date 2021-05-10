const fs   = require('fs/promises');
const path = require('path');
const Ajv  = require('ajv');

const Entity        = require('./Entity');
const TransportBase = require('./transport/TransportBase');
const HttpTransport = require('./transport/implementations/HttpTransport');
const WsTransport   = require('./transport/implementations/WsTransport');

const JSON_SPACES_NUMBER = 2;

class Api {
    constructor(structure, { transport = 'http', port, schemaOutDir } = {}) {
        this.structure = structure;
        this.entities = this.initEntities(structure);
        this.schemaOutDir = schemaOutDir;
        this.transportsImplementations = {
            http : new HttpTransport(this.entities, { port }),
            ws   : new WsTransport(this.entities, { port })
        };

        if (
            !(transport instanceof TransportBase) &&
            (typeof transport === 'string' && !Object.keys(this.transportsImplementations).includes(transport))
        ) {
            throw new TypeError('transport should be instance of TransportBase class ' +
                                `or one of the next strings: ${Object.keys(this.transportsImplementations)}`);
        }

        this.transport = transport instanceof TransportBase ? transport : this.transportsImplementations[transport];
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
                .reduce((entities, [ entityName, methods ]) => ({
                    ...entities,
                    [entityName] : Object
                        .entries(methods)
                        .map(([ methodName, methodClass ]) => ({
                            method      : methodName,
                            description : methodClass.description,
                            params      : methodClass.validationRules
                        }))
                }), {})
        };

        return schema;
    }

    async writeSchema(schema) {
        const schemaFilePath = path.join(this.schemaOutDir, 'schema.json');
        const schemaJsonString = JSON.stringify(schema, null, JSON_SPACES_NUMBER);

        await fs.writeFile(schemaFilePath, schemaJsonString);
    }
}

module.exports = Api;
