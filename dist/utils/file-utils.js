"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileExists = exports.removeDir = exports.removeFile = exports.readFile = exports.writeFile = void 0;
const node_fs_1 = require("node:fs");
function writeFile(path, data) {
    (0, node_fs_1.writeFileSync)(path, data, {
        flag: 'w',
    });
}
exports.writeFile = writeFile;
function readFile(path) {
    const contents = (0, node_fs_1.readFileSync)(path, 'utf-8');
    return contents;
}
exports.readFile = readFile;
function removeFile(path) {
    if (!(0, node_fs_1.existsSync)(path)) {
        return;
    }
    (0, node_fs_1.unlinkSync)(path);
}
exports.removeFile = removeFile;
function removeDir(path) {
    if ((0, node_fs_1.existsSync)(path)) {
        (0, node_fs_1.rmSync)(path, { recursive: true });
    }
}
exports.removeDir = removeDir;
function fileExists(path) {
    return (0, node_fs_1.existsSync)(path);
}
exports.fileExists = fileExists;
