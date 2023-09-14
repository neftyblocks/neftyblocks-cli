"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockManyTemplates = exports.createTemplates = exports.getTemplatesMap = exports.getNewTemplatesForCollectionAndSchema = exports.getTemplatesFromSchema = exports.getTemplatesForCollection = exports.getTemplates = exports.getTemplate = void 0;
const tslib_1 = require("tslib");
/* eslint-disable camelcase */
const Enums_1 = require("atomicassets/build/API/Explorer/Enums");
const time_utils_1 = tslib_1.__importDefault(require("../utils/time-utils"));
const antelope_service_1 = require("./antelope-service");
const array_utils_1 = require("../utils/array-utils");
const core_1 = require("@oclif/core");
async function getTemplate(collection, templateId, config) {
    return (0, antelope_service_1.getAtomicApi)(config.aaUrl).getTemplate(collection, templateId);
}
exports.getTemplate = getTemplate;
async function getTemplates(templateIds, collection, config) {
    return (0, antelope_service_1.getAtomicApi)(config.aaUrl).getTemplates({
        ids: templateIds,
        collection_name: collection,
    });
}
exports.getTemplates = getTemplates;
async function getTemplatesForCollection(collection, config) {
    let templatesInPage = [];
    let allTemplates = [];
    let page = 1;
    const batchSize = 100;
    do {
        templatesInPage = await (0, antelope_service_1.getAtomicApi)(config.aaUrl).getTemplates({
            collection_name: collection,
            sort: Enums_1.TemplatesSort.Created,
            order: Enums_1.OrderParam.Asc,
        }, page, batchSize);
        page++;
        allTemplates = [...allTemplates, ...templatesInPage];
    } while (templatesInPage.length >= batchSize);
    return allTemplates;
}
exports.getTemplatesForCollection = getTemplatesForCollection;
async function getTemplatesFromSchema(collection, schema, config) {
    let templatesInPage = [];
    let allTemplates = [];
    let page = 1;
    const batchSize = 100;
    do {
        templatesInPage = await (0, antelope_service_1.getAtomicApi)(config.aaUrl).getTemplates({
            collection_name: collection,
            schema_name: schema,
            sort: Enums_1.TemplatesSort.Created,
            order: Enums_1.OrderParam.Asc,
        }, page, batchSize);
        page++;
        allTemplates = [...allTemplates, ...templatesInPage];
    } while (templatesInPage.length >= batchSize);
    return allTemplates;
}
exports.getTemplatesFromSchema = getTemplatesFromSchema;
async function getNewTemplatesForCollectionAndSchema(collection, schema, batchSize, config) {
    let templatesInPage = [];
    let allTemplates = [];
    let page = 1;
    do {
        templatesInPage = await (0, antelope_service_1.getAtomicApi)(config.aaUrl).getTemplates({
            collection_name: collection,
            schema_name: schema,
            has_assets: false,
            issued_supply: 0,
            sort: Enums_1.TemplatesSort.Created,
            order: Enums_1.OrderParam.Asc,
        }, page, batchSize);
        page++;
        allTemplates = [...allTemplates, ...templatesInPage];
    } while (templatesInPage.length >= batchSize);
    return allTemplates;
}
exports.getNewTemplatesForCollectionAndSchema = getNewTemplatesForCollectionAndSchema;
async function getTemplatesMap(templateIds, config) {
    if (templateIds.length === 0) {
        return {};
    }
    const batchSize = 100;
    const batches = (0, array_utils_1.getBatchesFromArray)([...new Set(templateIds)], batchSize);
    let templates = [];
    for (let i = 0; i < batches.length; i++) {
        const ids = batches[i];
        const result = await (0, antelope_service_1.getAtomicApi)(config.aaUrl).getTemplates({
            ids: ids.join(','),
        }, 1, batchSize);
        templates = [...templates, ...result];
        if (i !== batches.length - 1) {
            await time_utils_1.default.sleep(500);
        }
    }
    return templates.reduce((map, obj) => {
        map[obj.template_id] = obj;
        return map;
    }, {});
}
exports.getTemplatesMap = getTemplatesMap;
async function createTemplates(collection, templates, config) {
    const session = config.session;
    const authorization = [
        {
            actor: session.actor,
            permission: session.permission,
        },
    ];
    const actions = templates.map((template) => {
        const { schema, maxSupply, isBurnable, isTransferable, immutableAttributes } = template;
        return {
            account: 'atomicassets',
            name: 'createtempl',
            authorization,
            data: {
                authorized_creator: session.actor,
                collection_name: collection,
                schema_name: schema,
                transferable: isTransferable,
                burnable: isBurnable,
                max_supply: maxSupply,
                immutable_data: immutableAttributes,
            },
        };
    });
    try {
        return await (0, antelope_service_1.transact)(actions, config);
    }
    catch (error) {
        core_1.ux.error('Error while creating templates...');
        throw error;
    }
}
exports.createTemplates = createTemplates;
async function lockManyTemplates(locks, config) {
    const session = config.session;
    const authorization = [
        {
            actor: session.actor,
            permission: session.permission,
        },
    ];
    const actions = locks.map((lock) => {
        return {
            account: 'atomicassets',
            name: 'locktemplate',
            authorization,
            data: {
                authorized_editor: session.actor,
                collection_name: lock.collectionName,
                template_id: lock.templateId,
            },
        };
    });
    return (0, antelope_service_1.transact)(actions, config);
}
exports.lockManyTemplates = lockManyTemplates;
