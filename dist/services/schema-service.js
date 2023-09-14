"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchema = exports.getSchema = exports.getCollectionSchemas = void 0;
const antelope_service_1 = require("./antelope-service");
const core_1 = require("@oclif/core");
async function getCollectionSchemas(collection, config) {
    const result = await (0, antelope_service_1.getAtomicRpc)(config.rpcUrl).getCollectionsSchemas(collection);
    return Promise.all(result.map(async (s) => ({
        name: s.name,
        collectionName: collection,
        format: await s.rawFormat(),
    })));
}
exports.getCollectionSchemas = getCollectionSchemas;
async function getSchema(collection, schema, config) {
    const result = await (0, antelope_service_1.getAtomicRpc)(config.rpcUrl).getSchema(collection, schema);
    return {
        name: result.name,
        collectionName: collection,
        format: await result.rawFormat(),
    };
}
exports.getSchema = getSchema;
async function createSchema(collectionName, schemaName, schemaFormat, config) {
    const session = config.session;
    const authorization = [
        {
            actor: session.actor,
            permission: session.permission,
        },
    ];
    try {
        return (0, antelope_service_1.transact)([
            {
                account: 'atomicassets',
                name: 'createschema',
                authorization,
                data: {
                    authorized_creator: session.actor,
                    collection_name: collectionName,
                    schema_name: schemaName,
                    schema_format: schemaFormat, // eslint-disable-line camelcase
                },
            },
        ], config);
    }
    catch (error) {
        core_1.ux.error('Error creating Schema');
        throw error;
    }
}
exports.createSchema = createSchema;
