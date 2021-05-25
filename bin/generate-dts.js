#!/usr/bin/env node

const fs          = require('fs');
const path        = require('path');
const { compile } = require('json-schema-to-typescript');
const prettier    = require('prettier');

const schemaPath = process.argv[2];

async function readSchema() {
    let schema = null;

    // TODO: implement schema validation
    try {
        schema = require(schemaPath);
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') throw new Error('Wrong path to schema');
        else throw err;
    }

    return schema;
}

async function generateInterfacesWithMethodSignatures(structure) {
    const interfacesWithMethodSignatures = {};

    for (const [ entityName, methodsSpec ] of Object.entries(structure)) {
        interfacesWithMethodSignatures[entityName] = [];

        for (const { method: methodName, params } of methodsSpec) {
            const paramsJsonSchema = {
                title      : `${entityName} ${methodName} Params`,
                type       : 'object',
                ...params,
                additionalProperties : false
            };

            const interface = await compile(paramsJsonSchema, '', { bannerComment : '' });
            const interfaceName = interface.match(/interface \S+/)[0].split(' ')[1];
            const methodSignature = `${methodName}(params: ${interfaceName}): Promise<any>`;

            interfacesWithMethodSignatures[entityName].push({
                interface,
                methodSignature
            });
        }
    }

    return interfacesWithMethodSignatures;
}

function generateApiInterface(interfacesAndMethodSignatures) {
    const entitiesSignature = [];

    for (const [ entityName, methodsInterfacesAndMethodSignatures ] of Object.entries(interfacesAndMethodSignatures)) {
        const methodsSignatures = methodsInterfacesAndMethodSignatures.map(({ methodSignature }) => methodSignature);
        let entitySignature = `${entityName}: {\n`;

        methodsSignatures.forEach(methodSignature => entitySignature += `  ${methodSignature};\n`);

        entitySignature += '}';

        entitiesSignature.push(entitySignature);
    }

    let apiInterface = 'export interface Api {\n';
    apiInterface += entitiesSignature.join(',\n');
    apiInterface += '\n}';

    return apiInterface;
}

async function generateDts() {
    const { structure } = await readSchema();
    const interfacesAndMethodSignatures = await generateInterfacesWithMethodSignatures(structure);
    const interfaces = Object.values(interfacesAndMethodSignatures).flat().map(({ interface }) => interface);
    const apiInterface = generateApiInterface(interfacesAndMethodSignatures);
    const dts = `
        declare module 'sbag' {
            ${interfaces.join('\n')}
            ${apiInterface}

        export function generateApi(schema: any, options: any): Promise<Api> 
    }`;
    const formattedDts = prettier.format(dts, {
        parser      : 'typescript',
        tabWidth    : 4,
        singleQuote : true
    });

    const dtsFilePath = path.join(process.cwd(), 'index.d.ts');

    fs.writeFileSync(dtsFilePath, formattedDts);

    console.log(`d.ts was successfully generated to ${dtsFilePath}`);
}

generateDts().catch(err => {
    console.error(err.message);

    process.exit(1);
});
