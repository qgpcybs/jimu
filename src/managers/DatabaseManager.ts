export class DatabaseManager {
    /**
     * Version should be added when changing the database structure (like add table)
     */
    static version: number = 2;

    /**
     * IndexedDB database
     */
    static indexedDB: IDBDatabase;

    /**
     * Table name of scenes (Version 1)
     */
    static TABLENAME_SCENES = "Scenes";

    /**
     * Table name of assets (Version 2)
     */
    static TABLENAME_ASSETS = "Assets";

    /**
     * Handle when editor start
     */
    static init(callback?: () => void) {
        if (DatabaseManager.enableStoreLocally()) {
            // Connecting to the database
            const openReq = window.indexedDB.open(
                "Jimu",
                DatabaseManager.version
            );

            // If database version update
            openReq.onupgradeneeded = function (event) {
                // Create scenes table
                const db = (DatabaseManager.indexedDB = (
                    event.target as IDBOpenDBRequest
                ).result);

                // Update database
                !db.objectStoreNames.contains(
                    DatabaseManager.TABLENAME_SCENES
                ) &&
                    db.createObjectStore(DatabaseManager.TABLENAME_SCENES, {
                        keyPath: "id",
                    });

                !db.objectStoreNames.contains(
                    DatabaseManager.TABLENAME_ASSETS
                ) &&
                    db.createObjectStore(DatabaseManager.TABLENAME_ASSETS, {
                        keyPath: "uuid",
                    });
            };

            // If database version no update
            openReq.onsuccess = function (event) {
                // Update database
                DatabaseManager.indexedDB = (
                    event.target as IDBOpenDBRequest
                ).result;
                if (callback) callback();
            };
        } else {
            console.warn("Can't use indexedDB.");
        }
    }

    /**
     * Check the browser
     * @returns True when window.indexedDB exists
     */
    static enableStoreLocally(): boolean {
        return window.indexedDB != null;
    }
}
