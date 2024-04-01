export class DatabaseManager {
    /**
     * The version should be added when changing the database structure (like add table)
     */
    static version: number = 1;

    /**
     * The indexedDB database
     */
    static indexedDB: IDBDatabase;

    /**
     * The table name of scenes (Version 1)
     */
    static TABLENAME_SCENES = "Scenes";

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
                DatabaseManager.indexedDB = (
                    event.target as IDBOpenDBRequest
                ).result;
                // Update database
                DatabaseManager.indexedDB.createObjectStore(
                    DatabaseManager.TABLENAME_SCENES,
                    {
                        keyPath: "id",
                    }
                );
                if (callback) callback();
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
