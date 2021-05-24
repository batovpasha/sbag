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

module.exports = { generateMethods };
