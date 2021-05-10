const schema = {
    'transport' : 'ws',
    'structure' : {
        'user' : [
            {
                'method'      : 'signUp',
                'description' : 'A method to sign up user',
                'params'      : {
                    'properties' : {
                        'username' : {
                            'type' : 'string'
                        },
                        'password' : {
                            'type' : 'string'
                        }
                    },
                    'required' : [
                        'username',
                        'password'
                    ]
                }
            },
            {
                'method'      : 'signIn',
                'description' : 'A method to sign in user',
                'params'      : {
                    'properties' : {
                        'username' : {
                            'type' : 'string'
                        },
                        'password' : {
                            'type' : 'string'
                        }
                    },
                    'required' : [
                        'username',
                        'password'
                    ]
                }
            }
        ]
    }
};

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
            return fetch(`${url}/${entityName}/${methodName}`, { // eslint-disable-line more/no-then
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
    const socket = new WebSocket(url);

    return generateMethods(
        structure,
        (entityName, methodName, params) => new Promise(resolve => {
            const packet = {
                entityName,
                methodName,
                params
            };

            socket.onmessage = event => {
                const result = JSON.parse(event.data);

                resolve(result);
            };

            socket.send(JSON.stringify(packet));
        })
    );
}

function generateApi(schema, options) {
    const { transport, structure } = schema;
    const { host, port } = options;

    const generatorsByTransport = {
        http : generateHttpApi,
        ws   : generateWsApi
    };

    const generator = generatorsByTransport[transport];

    if (!generator) throw new Error('Not supported transport');

    const url = `${transport}://${host}:${port}`;
    const api = generator(structure, { url });

    return api;
}
