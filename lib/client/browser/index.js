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
            fetch(`${url}/${entityName}/${methodName}`, { // eslint-disable-line more/no-then
                method  : 'POST',
                headers : {
                    'Content-Type' : 'application/json'
                },
                body : JSON.stringify(params)
            })
                .then(res => res.json())
                .then(resolve)
                .catch(reject);
        })
    );
}

function generateWsApi(structure, { url }) {
    return new Promise(resolve => {
        const socket = new WebSocket(url);
        const methods = generateMethods(
            structure,
            (entityName, methodName, params) => new Promise(resolveMethod => {
                const packet = {
                    entityName,
                    methodName,
                    params
                };

                socket.onmessage = event => {
                    const result = JSON.parse(event.data);

                    resolveMethod(result);
                };

                socket.send(JSON.stringify(packet));
            })
        );

        socket.onopen = () => resolve(methods);
    });
}

export async function generateApi(schema, options) {
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
