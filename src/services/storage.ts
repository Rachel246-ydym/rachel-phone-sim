// IndexedDB 统一封装：所有持久化必须经过本模块，禁止直接使用 localStorage

const DB_NAME = 'rachel-phone-sim'
const DB_VERSION = 2

export const STORE_NAMES = [
  'characters',
  'messages',
  'stories',
  'storyBranches',
  'archives',
  'memories',
  'heartVoices',
  'settings',
  'apiConfigs',
  'userProfile',
  'moments',
] as const

export type StoreName = (typeof STORE_NAMES)[number]

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        for (const name of STORE_NAMES) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' })
          }
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error(`无法打开数据库 ${DB_NAME}`))
    })
  }
  return dbPromise
}

function toPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 操作失败'))
  })
}

async function withStore<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  return toPromise(run(db.transaction(name, mode).objectStore(name)))
}

export async function get<T>(name: StoreName, id: string): Promise<T | undefined> {
  return withStore(name, 'readonly', (store) => store.get(id) as IDBRequest<T | undefined>)
}

export async function getAll<T>(name: StoreName): Promise<T[]> {
  return withStore(name, 'readonly', (store) => store.getAll() as IDBRequest<T[]>)
}

export async function put<T extends { id: string }>(name: StoreName, value: T): Promise<void> {
  await withStore(name, 'readwrite', (store) => store.put(value))
}

export async function remove(name: StoreName, id: string): Promise<void> {
  await withStore(name, 'readwrite', (store) => store.delete(id))
}

export async function clear(name: StoreName): Promise<void> {
  await withStore(name, 'readwrite', (store) => store.clear())
}

export function createId(): string {
  return crypto.randomUUID()
}
