"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionStorage = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const createSessionStorage = (sessionDir) => {
    const writeFile = async (key, data) => {
        const location = (0, node_path_1.join)(sessionDir, key);
        if (!(0, node_fs_1.existsSync)(sessionDir)) {
            (0, node_fs_1.mkdirSync)(sessionDir, { recursive: true });
        }
        (0, node_fs_1.writeFileSync)(location, data);
    };
    const readFile = async (key) => {
        const location = (0, node_path_1.join)(sessionDir, key);
        if (!(0, node_fs_1.existsSync)(location)) {
            return null;
        }
        const buffer = (0, node_fs_1.readFileSync)(location);
        return buffer.toString('utf-8');
    };
    const deleteFile = (key) => {
        const location = (0, node_path_1.join)(sessionDir, key);
        if (!(0, node_fs_1.existsSync)(location)) {
            return;
        }
        (0, node_fs_1.unlinkSync)(location);
    };
    return {
        write(key, data) {
            writeFile(key, data);
            return Promise.resolve();
        },
        read(key) {
            const data = readFile(key);
            if (data) {
                return Promise.resolve(data);
            }
            else {
                return Promise.resolve(null);
            }
        },
        remove(key) {
            deleteFile(key);
            return Promise.resolve();
        },
    };
};
exports.createSessionStorage = createSessionStorage;
