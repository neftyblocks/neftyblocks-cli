"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnburnedAssetsByTemplate = exports.getOwnedAssetsByTemplateIds = exports.getAssetsByTemplate = exports.burnAssets = exports.setAssetsData = exports.mintAssets = exports.getAssetsMap = exports.getAccountsBySchema = exports.batchedGetAssets = exports.getAssetsBySchema = exports.getAccounts = exports.getAssetsByCollectionAndOwner = exports.getAccountTemplates = void 0;
const tslib_1 = require("tslib");
const antelope_service_1 = require("./antelope-service");
const time_utils_1 = tslib_1.__importDefault(require("../utils/time-utils"));
const Enums_1 = require("atomicassets/build/API/Explorer/Enums");
const array_utils_1 = require("../utils/array-utils");
async function getAccountTemplates(account, options, config) {
    const accountDetails = await (0, antelope_service_1.getAtomicApi)(config.aaUrl).getAccount(account, options);
    const accountTemplates = accountDetails.templates;
    accountTemplates
        .filter((template) => template.template_id)
        .sort((a, b) => {
        return parseInt(a.assets) - parseInt(b.assets);
    });
    return accountTemplates;
}
exports.getAccountTemplates = getAccountTemplates;
async function getAssetsByCollectionAndOwner(owner, collection, pageSize, config) {
    const atomicApi = (0, antelope_service_1.getAtomicApi)(config.aaUrl);
    const collectionDetails = await atomicApi.getCollection(collection);
    if (collectionDetails === null) {
        throw `Collection: ${collection} does not exists`;
    }
    let assetsInPage = [];
    let allAssets = [];
    let page = 1;
    do {
        assetsInPage = await atomicApi.getAssets({
            collection_name: collection,
            owner: owner,
            sort: Enums_1.AssetsSort.Updated,
            order: Enums_1.OrderParam.Asc,
        }, page, pageSize);
        page++;
        allAssets = [...allAssets, ...assetsInPage];
    } while (assetsInPage.length >= pageSize);
    return allAssets;
}
exports.getAssetsByCollectionAndOwner = getAssetsByCollectionAndOwner;
async function getAccounts(options, config, page = 0, limit = 1000) {
    return (0, antelope_service_1.getAtomicApi)(config.aaUrl).getAccounts(options, page, limit);
}
exports.getAccounts = getAccounts;
async function getAssetsBySchema(collection, schema, config, batchSize = 400) {
    let assetsInPage = [];
    let allAssets = [];
    let page = 1;
    do {
        assetsInPage = await (0, antelope_service_1.getAtomicApi)(config.aaUrl).getAssets({
            collection_name: collection,
            schema_name: schema,
            sort: Enums_1.AssetsSort.Updated,
            order: Enums_1.OrderParam.Asc,
        }, page, batchSize);
        page++;
        allAssets = [...allAssets, ...assetsInPage];
    } while (assetsInPage.length >= batchSize);
    return allAssets;
}
exports.getAssetsBySchema = getAssetsBySchema;
async function batchedGetAssets(options, config, batchSize = 400) {
    let assetsInPage = [];
    let allAssets = [];
    let page = 1;
    do {
        assetsInPage = await (0, antelope_service_1.getAtomicApi)(config.aaUrl).getAssets(options, page, batchSize);
        page++;
        allAssets = [...allAssets, ...assetsInPage];
    } while (assetsInPage.length >= batchSize);
    return allAssets;
}
exports.batchedGetAssets = batchedGetAssets;
async function getAccountsBySchema(collection, schema, config) {
    let accounts = [];
    let hasMore = true;
    let page = 1;
    while (hasMore) {
        const result = await getAccounts({
            collection_name: collection,
            schema_name: schema,
        }, config, page);
        if (result.length > 0) {
            accounts = [...accounts, ...result];
            page += 1;
            hasMore = true;
        }
        else {
            hasMore = false;
        }
    }
    return accounts;
}
exports.getAccountsBySchema = getAccountsBySchema;
async function getAssetsMap(assetIds, config) {
    if (assetIds.length === 0) {
        return {};
    }
    const batchSize = 500;
    const batches = (0, array_utils_1.getBatchesFromArray)([...new Set(assetIds)], batchSize);
    let assets = [];
    for (let i = 0; i < batches.length; i++) {
        const ids = batches[i];
        const result = await (0, antelope_service_1.getAtomicApi)(config.aaUrl).getAssets({
            ids: ids.join(','),
        }, 1, batchSize);
        assets = [...assets, ...result];
        if (i !== batches.length - 1) {
            await time_utils_1.default.sleep(500);
        }
    }
    return assets.reduce((map, obj) => {
        map[obj.asset_id] = obj;
        return map;
    }, {});
}
exports.getAssetsMap = getAssetsMap;
// @TODO: write less generic functions like: mintAssetsWithAttributes and
// mintAssetsWithoutAttributes instead of expecting the caller of this funtion
// to pass a valid and complete actionData, let them pass a "abstraction"
// that only has, for example: amount, templateId and immutable attributes
async function mintAssets(mints, config) {
    const session = config.session;
    const authorization = [
        {
            actor: session.actor,
            permission: session.permission,
        },
    ];
    const actions = mints.map((actionData) => {
        return {
            account: 'atomicassets',
            name: 'mintasset',
            authorization,
            data: actionData,
        };
    });
    const neftyActions = [
        {
            account: 'neftyblocksa',
            name: 'validate',
            authorization,
            data: {
                nonce: Math.floor(Math.random() * 1000000000),
            },
        },
        ...actions,
    ];
    return (0, antelope_service_1.transact)(neftyActions, config);
}
exports.mintAssets = mintAssets;
async function setAssetsData(actionSetAssetDataArray, config) {
    const session = config.session;
    const authorization = [
        {
            actor: session.actor,
            permission: session.permission,
        },
    ];
    const actions = actionSetAssetDataArray.map((actionSetAssetData) => {
        return {
            account: 'atomicassets',
            name: 'setassetdata',
            authorization,
            data: actionSetAssetData,
        };
    });
    return (0, antelope_service_1.transact)(actions, config);
}
exports.setAssetsData = setAssetsData;
async function burnAssets(assetIds, config) {
    const session = config.session;
    const authorization = [
        {
            actor: session.actor,
            permission: session.permission,
        },
    ];
    const actions = assetIds.map((assetId) => {
        return {
            account: 'atomicassets',
            name: 'burnasset',
            authorization,
            data: {
                asset_owner: session.actor,
                asset_id: assetId,
            },
        };
    });
    return (0, antelope_service_1.transact)(actions, config);
}
exports.burnAssets = burnAssets;
async function getAssetsByTemplate(templateId, account, amount, config, batchSize = 100) {
    let fetchAssets = true;
    let page = 1;
    let assets = [];
    let left = amount;
    while (fetchAssets && left > 0) {
        const limit = Math.min(left, batchSize);
        const results = await (0, antelope_service_1.getAtomicApi)(config.aaUrl).getAssets({
            owner: account,
            sort: Enums_1.AssetsSort.AssetId,
            order: Enums_1.OrderParam.Asc,
            template_id: templateId,
        }, page, batchSize);
        fetchAssets = results.length > 0;
        page += 1;
        left -= batchSize;
        assets = [...assets, ...results.slice(0, limit)];
        // avoid getting rate limited
        time_utils_1.default.sleep(500);
    }
    return assets;
}
exports.getAssetsByTemplate = getAssetsByTemplate;
// @TODO: document params. it is weird how we have 2 different batch sizes
async function getOwnedAssetsByTemplateIds(templateIds, account, config, templateIdsBatchSize = 100, assetsBatchSize = 400) {
    const templateIdsBatches = (0, array_utils_1.getBatchesFromArray)(templateIds, templateIdsBatchSize);
    let allAssets = [];
    for (const templateIdsBatch of templateIdsBatches) {
        const templateIdsString = templateIdsBatch.join(',');
        let assetsInPage = [];
        let page = 1;
        do {
            assetsInPage = await (0, antelope_service_1.getAtomicApi)(config.aaUrl).getAssets({
                owner: account,
                sort: Enums_1.AssetsSort.AssetId,
                order: Enums_1.OrderParam.Asc,
                template_whitelist: templateIdsString,
            }, page, assetsBatchSize);
            page++;
            allAssets = [...allAssets, ...assetsInPage];
        } while (assetsInPage.length >= assetsBatchSize);
    }
    return allAssets;
}
exports.getOwnedAssetsByTemplateIds = getOwnedAssetsByTemplateIds;
async function getUnburnedAssetsByTemplate(templateId, amount, config, batchSize = 100) {
    let fetchAssets = true;
    let page = 1;
    let assets = [];
    let left = amount;
    while (fetchAssets && left > 0) {
        const results = await (0, antelope_service_1.getAtomicApi)(config.aaUrl).getAssets({
            burned: false,
            sort: Enums_1.AssetsSort.AssetId,
            order: Enums_1.OrderParam.Asc,
            template_id: templateId,
        }, page, batchSize);
        fetchAssets = results.length > 0;
        page += 1;
        left -= results.length;
        assets = [...assets, ...results];
        // avoid getting rate limited
        time_utils_1.default.sleep(500);
    }
    return assets;
}
exports.getUnburnedAssetsByTemplate = getUnburnedAssetsByTemplate;
