const Ajv = require('ajv');

const HttpTransport = require('./transports/default/HttpTransport');

class Api {
    // TODO: implement structure validation
    constructor(structure, { transport = 'http', schemaOutDir } = {}) {
        this.validator = new Ajv({ removeAdditional: 'all', allErrors: true, coerceTypes: true });

        this.initStructure(structure);

        this.structure = structure;
        this.schemaOutDir = schemaOutDir;

        this.defaultTransports = {
            http : new HttpTransport(structure)
        };

        if (typeof transport === 'string' && !Object.keys(this.defaultTransports).includes(transport)) {
            throw new Error(`Unsupported transport type "${transport}"`);
        }

        this.transport = typeof transport === 'string' ? this.defaultTransports[transport] : transport;
    }

    initStructure(structure) {
        Object
            .entries(structure)
            .forEach(([ entityName, methods ]) => {
                Object
                    .entries(methods)
                    .forEach(([ methodName, ServiceClass ]) => {
                        // eslint-disable-next-line no-param-reassign
                        structure[entityName][methodName] = new ServiceClass(this.validator);
                    });
            });
    }

    async start() {
        await this.transport.start();
    }
}

module.exports = Api;
