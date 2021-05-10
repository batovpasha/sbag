const EXCEPTION_CODES = require('./exception/codes');
const Exception       = require('./exception/Exception');
const MethodBase      = require('./MethodBase');

class Entity {
    constructor(name, methods = {}, { validator } = {}) {
        this.name = name;
        this.methods = this.initMethods(methods, validator);
    }

    initMethods(methods, validator) {
        return Object
            .entries(methods)
            .reduce((acc, [ methodName, MethodClass ]) => {
                if (!(MethodClass.prototype instanceof MethodBase)) {
                    throw new TypeError(`method "${methodName}" of "${this.name}" entity ` +
                                        'should be inherited from MethodBase class');
                }

                return {
                    ...acc,
                    [methodName] : new MethodClass(validator)
                };
            }, {});
    }

    runMethod(methodName, params) {
        const method = this.methods[methodName];

        if (!method) throw new Exception(EXCEPTION_CODES.ENTITY_METHOD_NOT_FOUND);

        return method.run(params);
    }
}

module.exports = Entity;
