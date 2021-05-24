const http      = require('http');
const WebSocket = require('ws');

const { generateMethods } = require('../utils');

function generateHttpApi(structure, { url }) {
    return generateMethods(
        structure,
        (entityName, methodName, params = {}) => new Promise((resolve, reject) => {
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
                const result = JSON.parse(data);

                resolve(result);
            });

            request.on('error', reject);
            request.write(paramsJson);
            request.end();
        })
    );
}

function generateWsApi(structure, { url }) {
    return new Promise(resolve => {
        const ws = new WebSocket(url);
        const methods = generateMethods(
            structure,
            (entityName, methodName, params) => new Promise((resolveMethod, rejectMethod) => {
                const packet = {
                    entityName,
                    methodName,
                    params
                };

                ws.on('error', rejectMethod);

                ws.on('message', data => {
                    const result = JSON.parse(data);

                    resolveMethod(result);
                });

                ws.send(JSON.stringify(packet));
            })
        );

        ws.on('open', () => resolve(methods));
    });
}

async function generateApi(schema, options) {
    const { transport, port, structure } = schema;
    const { host } = options;

    const generatorsByTransport = {
        http : generateHttpApi,
        ws   : generateWsApi
    };
    const generator = generatorsByTransport[transport];

    if (!generator) throw new Error('Not supported transport');

    const url = `${transport}://${host}:${port}`;
    const api = await generator(structure, { url });

    return api;
}

module.exports = { generateApi };
