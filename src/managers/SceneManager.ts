export class SceneManager {
    static indexedDB: IDBFactory = window.indexedDB;
    static version: number = 1;
    static tableName = "Tilemaps";
    static openReq: IDBOpenDBRequest;
    static tableDatabase: IDBDatabase;

    static init() {
        if (SceneManager.enableStoreLocally()) {
            // Connecting to the database
            SceneManager.openReq = SceneManager.indexedDB.open(
                "Jimu",
                SceneManager.version
            );

            // If database version update
            SceneManager.openReq.onupgradeneeded = function (event) {
                // Create scenes table
                SceneManager.tableDatabase = (
                    event.target as IDBOpenDBRequest
                ).result;
                // Update database
                SceneManager.tableDatabase.createObjectStore(
                    SceneManager.tableName,
                    {
                        keyPath: "id",
                    }
                );
            };

            // If database version no update
            SceneManager.openReq.onsuccess = function (event) {
                // Update database
                SceneManager.tableDatabase = (
                    event.target as IDBOpenDBRequest
                ).result;
            };
        } else {
            console.warn("Can't use indexedDB.");
        }
    }

    /**
     * Save the tilemap
     * @param tilemapName the name of the tilemap
     * @param data the tileset data
     */
    static saveTileMap(tilemapName: string, data: string) {
        // Create a transaction
        const trans = SceneManager.tableDatabase.transaction(
            [SceneManager.tableName],
            "readwrite"
        );
        // Get the table
        const table = trans.objectStore(SceneManager.tableName);
        // Write the data
        const putReq = table.put({ id: tilemapName, data: data });
        putReq.onsuccess = () => {};
    }

    static loadTilemap(tilemapName: string) {
        const trans = SceneManager.tableDatabase.transaction(
            SceneManager.tableName,
            "readonly"
        );
        const store = trans.objectStore(SceneManager.tableName);
        return store.get(tilemapName);
    }

    static enableStoreLocally(): IDBFactory {
        return window.indexedDB;
    }
}
