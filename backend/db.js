import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'data', 'db.json');

class JSONDatabase {
  async read() {
    try {
      const data = await fs.readFile(dbPath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to read db.json, returning empty object', err);
      return {};
    }
  }

  async write(data) {
    try {
      await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write to db.json', err);
    }
  }

  async find(collection, query = {}) {
    const data = await this.read();
    const items = data[collection] || [];
    return items.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async findOne(collection, query = {}) {
    const data = await this.read();
    const items = data[collection] || [];
    return items.find(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  }

  async insert(collection, doc) {
    const data = await this.read();
    if (!data[collection]) data[collection] = [];
    
    // Generate a unique ID if not provided
    const prefix = collection.substring(0, 4);
    const id = doc.id || `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const newDoc = { id, ...doc };
    data[collection].push(newDoc);
    await this.write(data);
    return newDoc;
  }

  async update(collection, query, updates) {
    const data = await this.read();
    const items = data[collection] || [];
    let updatedCount = 0;
    let updatedItem = null;
    
    data[collection] = items.map(item => {
      let matches = true;
      for (const key in query) {
        if (item[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        updatedCount++;
        const merged = { ...item, ...updates };
        updatedItem = merged;
        return merged;
      }
      return item;
    });

    if (updatedCount > 0) {
      await this.write(data);
    }
    return updatedItem;
  }

  async delete(collection, query) {
    const data = await this.read();
    const items = data[collection] || [];
    const initialLen = items.length;
    
    data[collection] = items.filter(item => {
      let matches = true;
      for (const key in query) {
        if (item[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      return !matches;
    });

    const deletedCount = initialLen - data[collection].length;
    if (deletedCount > 0) {
      await this.write(data);
    }
    return deletedCount;
  }
}

export const db = new JSONDatabase();
export default db;
