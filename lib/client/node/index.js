const http = require('http');

function generateMethods(structure, methodHandler) {
    return Object
        .entries(structure)
        .reduce((entities, [ entityName, methodsObjs ]) => ({
            ...entities,
            [entityName] : methodsObjs.reduce((methods, { method: methodName }) => ({
                ...methods,
                [methodName] : params => methodHandler(entityName, methodName, params)
            }), {})
        }), {});
}

function generateHttpApi(structure, { url }) {
    return generateMethods(
        structure,
        (entityName, methodName, params) => new Promise((resolve, reject) => {
            const paramsJson = JSON.stringify(params);

            const request = http.request(`${url}/${entityName}/${methodName}`, {
                method  : 'POST',
                headers : {
                    'Content-Type'   : 'application/json',
                    'Content-Length' : Buffer.byteLength(paramsJson)
                }
            }, async res => {
                const buffers = [];

                for await (const chunk of res) buffers.push(chunk);

                const data = Buffer.concat(buffers).toString();
                const result = JSON.stringify(data);

                resolve(result);
            });

            request.on('error', reject);
            request.write(paramsJson);
            request.end();
        })
    );
}

async function generateApi(schema, options) {
    const { transport, port, structure } = schema;
    const { host } = options;

    const generatorsByTransport = {
        http : generateHttpApi
    };
    const generator = generatorsByTransport[transport];

    if (!generator) throw new Error('Not supported transport');

    const url = `${transport}://${host}:${port}`;
    const api = await generator(structure, { url });

    return api;
}

module.exports = { generateApi };
