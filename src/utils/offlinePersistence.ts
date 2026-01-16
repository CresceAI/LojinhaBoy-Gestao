// ✅ Tipagem semântica para diferenciar ações (Heurística #1 e #5)
export interface OfflineAction<T = any> {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: T;
  recordId?: string; // ID do registro no banco (obrigatório para UPDATE/DELETE)
  timestamp: string;
  status: 'pending' | 'failed';
  retryCount: number;
  lastAttempt?: string;
  error?: string;
}

const DB_NAME = 'LojinhaBoyOffline';
const STORE_NAME = 'sync_queue';
const DB_VERSION = 3; // Incremetado para suportar a nova estrutura de ações

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Abre IndexedDB com cache de conexão e tratamento de upgrade
 */
const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
};

/**
 * ✅ MELHORIA: Salva qualquer ação na fila da banca (Semântico e Assertivo)
 * Substitui o antigo saveOfflineEmprestimo para suportar Edição e Exclusão.
 */
export const saveOfflineAction = async (
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  table: string,
  dados: any,
  recordId?: string
): Promise<OfflineAction> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const item: OfflineAction = {
      id: crypto.randomUUID(),
      action,
      table,
      data: dados,
      recordId,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => {
        console.log(`🦈 [Shark Engine] Ação ${action} enfileirada:`, item.id);
        resolve(item);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ [Shark Engine] Falha ao salvar ação offline:', error);
    throw error;
  }
};

/**
 * ✅ Lista fila por status para o Motor de Sincronia
 */
export const getOfflineQueue = async (status: 'pending' | 'failed' = 'pending'): Promise<OfflineAction[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll(status);
      request.onsuccess = () => resolve(request.result as OfflineAction[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    return [];
  }
};

/**
 * ✅ Remove item após sucesso no servidor
 */
export const removeOfflineItem = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch (error) {
    console.error('❌ Erro ao remover item offline:', error);
  }
};

/**
 * ✅ Marca como falha e registra o log técnico (Heurística #5 - Prevenção de Erros)
 */
export const markAsFailed = async (id: string, errorMsg?: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const request = store.get(id);
    request.onsuccess = () => {
      const item = request.result as OfflineAction;
      if (item) {
        item.status = 'failed';
        item.retryCount += 1;
        item.lastAttempt = new Date().toISOString();
        item.error = errorMsg || 'Falha na sincronia';
        store.put(item);
      }
    };
  } catch (error) {
    console.error('❌ Erro ao registrar falha:', error);
  }
};

/**
 * ✅ Limpeza automática (>7 dias) - Manutenção de Performance
 */
export const cleanupOldQueue = async (): Promise<void> => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const range = IDBKeyRange.upperBound(weekAgo);

    store.index('timestamp').openCursor(range).onsuccess = (event) => {
      const cursor = (event.target as any).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (error) {
    console.warn('⚠️ [Shark Engine] Falha na auto-limpeza');
  }
};

/**
 * ✅ Heurística #1: Retorna contagem para feedback visual na UI
 */
export const getPendingCount = async (): Promise<number> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('status');
    
    return new Promise((resolve) => {
      const request = index.count('pending');
      request.onsuccess = () => resolve(request.result);
    });
  } catch {
    return 0;
  }
};