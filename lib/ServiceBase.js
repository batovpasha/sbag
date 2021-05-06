const ERROR_CODES = require('./errors/codes');
const ApiError    = require('./errors/ApiError');

module.exports = class ServiceBase {
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
            throw new ApiError(ERROR_CODES.PARAMS_VALIDATION_ERROR, this.validateParams.errors);
        }

        return data;
    }

    async execute() {
        throw new Error('method "execute" should be implemented');
    }
};
