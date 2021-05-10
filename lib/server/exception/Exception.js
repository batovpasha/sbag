const CODES = require('./codes');

class Exception {
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
        }),
        [CODES.ENTITY_NOT_FOUND] : () => ({
            message : 'Entity is not found',
            fields  : []
        }),
        [CODES.ENTITY_METHOD_NOT_FOUND] : () => ({
            message : 'Entity method is not found',
            fields  : []
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

    // method for serialization exception
    toJSON() {
        return {
            code    : this.code,
            message : this.message,
            fields  : this.fields
        };
    }
}

module.exports = Exception;
