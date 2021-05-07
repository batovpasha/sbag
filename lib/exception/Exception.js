const CODES = require('./codes');

module.exports = class Exception {
    static defaultFields = {
        message : 'API error',
        fields  : []
    };

    static fieldsByCodes = {
        [CODES.INVALID_PARAMS] : payload => ({
            message : 'Invalid params',
            fields  : payload.map(error => ({
                path    : error.instancePath,
                message : error.message
            }))
        })
    };

    static getFieldsByCode(code, payload) {
        const getFieldsByCode = this.fieldsByCodes[code];

        return getFieldsByCode && getFieldsByCode(payload);
    }

    constructor(code, payload) {
        const {
            message,
            fields
        } = this.constructor.getFieldsByCode(code, payload) || this.constructor.defaultFields;

        this.code = code;
        this.message = message;
        this.fields = fields;
    }
};
