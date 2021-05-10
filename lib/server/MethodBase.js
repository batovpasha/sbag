const EXCEPTION_CODES = require('./exception/codes');
const Exception       = require('./exception/Exception');

module.exports = class MethodBase {
    static description = ''; // property to define method description for a API schema

    static validationRules = {
        properties : {}
    };

    constructor(validator) {
        // compile validation function in the constructor for its caching
        this.validateParams = validator.compile({
            ...this.constructor.validationRules,
            type                 : 'object',
            additionalProperties : false
        });
    }

    run(params) {
        const cleanParams = this.validate(params);

        return this.execute(cleanParams);
    }

    validate(data) {
        const isValid = this.validateParams(data);

        if (!isValid) {
            throw new Exception(EXCEPTION_CODES.INVALID_PARAMS, this.validateParams.errors);
        }

        return data;
    }

    async execute() {
        throw new Error('method "execute" should be implemented');
    }
};
