const schema = {
    'transport' : 'http',
    'structure' : {
        'test' : [
            {
                'method'      : 'testMethod',
                'description' : 'A test method -)',
                'params'      : {
                    'properties' : {
                        'name' : {
                            'type' : 'string'
                        },
                        'password' : {
                            'type' : 'string'
                        }
                    },
                    'required' : [
                        'name',
                        'password'
                    ]
                }
            }
        ],
        'lol' : [
            {
                'method'      : 'lolMethod',
                'description' : 'A lol method =)',
                'params'      : {
                    'properties' : {
                        'surname' : {
                            'type' : 'string'
                        },
                        'password' : {
                            'type' : 'string'
                        }
                    },
                    'required' : [
                        'surname',
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
            entities[entityName] = methods.reduce((accMethods, { method, paramsValidation }) => {
                accMethods[method] = (params) => new Promise((resolve, reject) => {
                    // TODO: implement args validation

                    return fetch(url, {
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

function generateApi(schema, options) {
    const { transport, structure } = schema;
    const { host, port } = options;

    const generatorsByTransport = {
        http : generateHttpApi
    };

    const generator = generatorsByTransport[transport];

    if (!generator) throw new Error('Not supported transport');

    const url = `${transport}://${host}:${port}`;
    const api = generator(structure, { url });

    return api;
}
