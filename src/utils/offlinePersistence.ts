// src/utils/offlinePersistence.ts

interface OfflineItem {
  id: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'failed' | 'synced';
  retryCount?: number;
  lastAttempt?: string;
}

const DB_NAME = 'LojinhaBoyOffline';
const STORE_NAME = 'sync_queue';
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Abre IndexedDB com cache de conexão
 */
const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onupgradeneeded = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
};

/**
 * ✅ Salva empréstimo offline
 */
export const saveOfflineEmprestimo = async (dados: any): Promise<OfflineItem> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const item: OfflineItem = {
      id: crypto.randomUUID(),
      data: dados,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => {
        console.log('✅ Empréstimo salvo offline:', item.id);
        resolve(item);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erro ao salvar offline:', error);
    throw error;
  }
};

/**
 * ✅ Lista fila por status
 */
export const getOfflineQueue = async (status: 'pending' | 'failed' = 'pending'): Promise<OfflineItem[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll(status);
      request.onsuccess = () => {
        // ✅ TypeScript feliz: cast direto do result
        const result = request.result as OfflineItem[];
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erro ao ler fila offline:', error);
    return [];
  }
};

/**
 * ✅ Remove item após sucesso
 */
export const removeOfflineItem = async (id: string): Promise<boolean> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('✅ Item offline removido:', id);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erro ao remover offline:', error);
    throw error;
  }
};

/**
 * ✅ Marca como falha (retry)
 */
export const markAsFailed = async (id: string): Promise<OfflineItem> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const item = await getOfflineItem(id);
    if (!item) throw new Error('Item não encontrado');

    const updatedItem: OfflineItem = {
      ...item,
      status: 'failed',
      retryCount: (item.retryCount || 0) + 1,
      lastAttempt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(updatedItem);
      request.onsuccess = () => resolve(updatedItem);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erro ao marcar como falha:', error);
    throw error;
  }
};

/**
 * ✅ Busca item específico
 */
const getOfflineItem = async (id: string): Promise<OfflineItem | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const result = request.result as OfflineItem | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erro ao buscar item offline:', error);
    return null;
  }
};

/**
 * ✅ Limpa itens antigos (>7 dias)
 */
export const cleanupOldQueue = async (): Promise<void> => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');

    const itemsToDelete: string[] = [];
    const range = IDBKeyRange.upperBound(weekAgo);
    
    return new Promise((resolve, reject) => {
      const cursorRequest = index.openCursor(range);
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          // ✅ Cursor.value é type-safe
          itemsToDelete.push((cursor.value as OfflineItem).id);
          cursor.continue();
        } else {
          // Deleta em batch
          itemsToDelete.forEach(id => store.delete(id));
          resolve();
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  }
};

// ✅ Auto-limpeza
if ('serviceWorker' in navigator) {
  window.addEventListener('load', cleanupOldQueue);
}
