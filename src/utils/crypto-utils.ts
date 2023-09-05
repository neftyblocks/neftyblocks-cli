import crypto from "node:crypto";
import CliConfig from "../types/cli-config";
import { readFile } from "./file-utils";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // For AES, this is always 16
const neftyPadding = Buffer.from("neftyblocks-cli padding").toString("base64");

export function encrypt(text: string, encryptionKey: string): string {
  const key = paddingPassword(encryptionKey); // must be 32
  const iv = Buffer.from(crypto.randomBytes(IV_LENGTH))
    .toString("hex")
    .slice(0, IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv + ":" + encrypted.toString("hex");
}

export function decrypt(text: string, encryptionKey: string): string | null {
  try {
    const key = paddingPassword(encryptionKey);
    const textParts: string[] = text.includes(":") ? text.split(":") : [];
    const iv = Buffer.from(textParts.shift() || "", "binary");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return null;
  }
}

export function paddingPassword(text: string): string {
  let key = text;
  if (key.length < 32) {
    key += neftyPadding.slice(0, Math.max(0, 32 - key.length));
  }

  return key;
}

export function decryptConfigurationFile(
  password: string,
  configPath: string
): CliConfig | null {
  const contents = readFile(configPath);
  const decrypted = decrypt(contents, password);
  if (decrypted !== null) {
    const jsonObject = JSON.parse(decrypted) as CliConfig;
    return jsonObject;
  }

  return null;
}
