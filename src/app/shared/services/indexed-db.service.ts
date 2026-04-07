import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class IndexedDbService {
    private dbName = 'POS_DB';
    private dbVersion = 2;
    private readonly storeName = 'session';

    constructor() {
        this.initDb();
    }

    private initDb(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Database error:', event);
                reject('Database error');
            };

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };

            request.onsuccess = (event) => {
                resolve();
            };
        });
    }

    public async set(key: string, value: any): Promise<void> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e);
        });
    }

    public async get<T>(key: string): Promise<T | null> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = (event: any) => {
                resolve(event.target.result ? (event.target.result as T) : null);
            };
            request.onerror = (e) => reject(e);
        });
    }

    public async remove(key: string): Promise<void> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e);
        });
    }

    public async clear(): Promise<void> {
        const db = await this.openDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e);
        });
    }

    private openDb(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onsuccess = (event: any) => resolve(event.target.result);
            request.onerror = (event) => reject(event);
        });
    }
}
