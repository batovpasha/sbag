const ERROR_CODES = require('./codes');

module.exports = class ApiError extends Error {
    static defaultErrorFields = {
        message : 'API error',
        fields  : []
    };

    static errorFieldsByCodes = {
        [ERROR_CODES.PARAMS_VALIDATION_ERROR] : payload => ({
            message : 'Params validation error',
            fields  : payload.map(error => ({
                path    : error.instancePath,
                message : error.message
            }))
        })
    };

    static getErrorFieldsByCode(code, payload) {
        const getErrorFieldsByCode = this.errorFieldsByCodes[code];

        return getErrorFieldsByCode && getErrorFieldsByCode(payload);
    }

    constructor(code, payload) {
        const { message, fields } = ApiError.getErrorFieldsByCode(code, payload) || ApiError.defaultErrorFields;

        super(message);

        this.message = message;
        this.fields = fields;
    }
};
