import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const createSessionStorage = (sessionDir: string) => {
  const writeFile = async (key: string, data: string): Promise<void> => {
    const location = join(sessionDir, key);
    if (!existsSync(sessionDir)) {
      mkdirSync(sessionDir, { recursive: true });
    }
    writeFileSync(location, data);
  };

  const readFile = async (key: string): Promise<string | null> => {
    const location = join(sessionDir, key);
    if (!existsSync(location)) {
      return null;
    }
    const buffer = readFileSync(location);
    return buffer.toString('utf-8');
  };

  const deleteFile = (key: string): void => {
    const location = join(sessionDir, key);
    if (!existsSync(location)) {
      return;
    }
    unlinkSync(location);
  };

  return {
    write(key: string, data: string): Promise<void> {
      writeFile(key, data);
      return Promise.resolve();
    },
    read(key: string): Promise<string | null> {
      const data = readFile(key);
      if (data) {
        return Promise.resolve(data);
      } else {
        return Promise.resolve(null);
      }
    },
    remove(key: string): Promise<void> {
      deleteFile(key);
      return Promise.resolve();
    },
  };
};
