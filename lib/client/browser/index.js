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

function generateHttpApi(structure, { url }) {
    return Object
        .entries(structure)
        .reduce((entities, [ entityName, methods ]) => {
            entities[entityName] = methods.reduce((accMethods, { method }) => {
                accMethods[method] = (params) => new Promise((resolve, reject) => {
                    // TODO: implement args validation

                    return fetch(`${url}/${entityName}/${method}`, {
                        method  : 'POST',
                        headers : {
                            'Content-Type' : 'application/json'
                        },
                        body : JSON.stringify(params)
                    })
                        .then(res => res.json())
                        .then(resolve)
                        .catch(reject);
                });

                return accMethods;
            }, {});

            return entities;
        }, {});
}

function generateWsApi(structure, { url }) {
    const socket = new WebSocket(url);

    return Object
        .entries(structure)
        .reduce((entities, [ entityName, methods ]) => {
            entities[entityName] = methods.reduce((accMethods, { method }) => {
                accMethods[method] = (params) => new Promise((resolve) => {
                    const packet = {
                        entityName,
                        methodName : method,
                        params
                    };

                    socket.onmessage = event => {
                        const result = JSON.parse(event.data);

                        resolve(result);
                    };

                    socket.send(JSON.stringify(packet));
                });

                return accMethods;
            }, {});

            return entities;
        }, {});
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
