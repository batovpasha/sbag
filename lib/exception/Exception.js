const ERROR_CODES = require('./codes');

module.exports = class Exception {
    static defaultErrorFields = {
        message : 'API error',
        fields  : []
    };

    static errorFieldsByCodes = {
        [ERROR_CODES.INVALID_PARAMS] : payload => ({
            message : 'Invalid params',
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
        const { message, fields } = Exception.getErrorFieldsByCode(code, payload) || Exception.defaultErrorFields;

        this.message = message;
        this.fields = fields;
    }
};
