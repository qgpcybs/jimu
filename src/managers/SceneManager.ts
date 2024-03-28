export class SceneManager {
    static indexedDB: IDBFactory = window.indexedDB;
    static version: number = 1;
    static tableName = "Scenes";
    static scenes;
    static openReq: IDBOpenDBRequest;
    static tableDatabase: IDBDatabase;

    /**
     * Handle when editor start
     * To create the table of scenes
     */
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
     * [Async] Create a new scene
     * The primary key is id
     * @param tilemapName The name of scene
     * @param width The width of scene
     * @param height The height of scene
     */
    static createScene(
        tilemapName: string = "abab",
        width: number = 40,
        height: number = 23
    ) {
        // Create a transaction
        const trans = SceneManager.tableDatabase.transaction(
            [SceneManager.tableName],
            "readwrite"
        );

        // Get the table
        const table = trans.objectStore(SceneManager.tableName);

        // Iterate over scenes to generate a list of ids
        const ids: boolean[] = [];
        const openCursor = table.openCursor();
        openCursor.onsuccess = () => {
            const item = openCursor.result;
            if (item) {
                // Put existing ids into the array
                ids[Number(item.primaryKey)] = true;
                item.continue();
            } else {
                // Find a new id as key
                let newId: number;
                for (let i = 0; ; i++) {
                    if (ids[i] !== true) {
                        newId = i;
                        break;
                    }
                }

                // Construct the scene data
                const sceneData = {
                    id: newId,
                    name: tilemapName,
                    data: [] as number[][],
                };
                for (let i = 0; i < height; i++) {
                    sceneData.data[i] = [];
                    for (let j = 0; j < width; j++) {
                        sceneData.data[i][j] = 32;
                    }
                }

                // Create the scene by id
                table.add(sceneData);
            }
        };
    }

    static getScenesNumber(): number {
        return 1;
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

    /**
     * Load the tilemap
     * @param tilemapName the name of the tilemap
     * @returns the tileset data
     */
    static loadTilemap(tilemapName: string): IDBRequest {
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
