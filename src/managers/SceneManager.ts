export class SceneManager {
    static indexedDB: IDBFactory = window.indexedDB;
    static tableName = "Tilemaps";
    static openReq: IDBOpenDBRequest;
    static database: IDBDatabase;

    static enableStoreLocally(): IDBFactory {
        return window.indexedDB;
    }

    static init() {
        SceneManager.openReq = SceneManager.indexedDB.open("Jimu", 1);

        SceneManager.openReq.onupgradeneeded = function (event) {
            SceneManager.database = (event.target as IDBOpenDBRequest).result;
            SceneManager.database.createObjectStore(SceneManager.tableName, {
                keyPath: "id",
            });
        };

        SceneManager.openReq.onsuccess = function (event) {
            SceneManager.database = (event.target as IDBOpenDBRequest).result;
        };
    }

    static saveTileMap(tilemapName: string, data) {
        // const openReq = SceneManager.indexedDB.open("Jimu");
        // SceneManager.openReq.onsuccess = function (event) {
        //     const target = event.target as IDBOpenDBRequest;
        //     const db = target.result;

        // 录入
        const trans1 = SceneManager.database.transaction(
            [SceneManager.tableName],
            "readwrite"
        );
        const store1 = trans1.objectStore(SceneManager.tableName);
        const putReq = store1.put({ id: tilemapName, data: data });
        putReq.onsuccess = () => {
            // console.log(JSON.parse(data));
        };
        // };
    }

    static loadTilemap(tilemapName: string) {
        // const openReq = SceneManager.indexedDB.open("Jimu");
        // SceneManager.openReq.onsuccess = function (event) {
        // const target = event.target as IDBOpenDBRequest;
        // const db = target.result;
        const trans = SceneManager.database.transaction(
            SceneManager.tableName,
            "readonly"
        );
        const store = trans.objectStore(SceneManager.tableName);
        // console.log(store);
        return store.get(tilemapName);

        // };
    }
}
