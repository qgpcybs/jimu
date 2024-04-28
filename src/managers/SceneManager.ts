import {
    SceneDatabase,
    SceneData,
    LayerData,
    SceneInfo,
    LayerInfo,
} from "../api/Scenes";
import { DatabaseManager } from "./DatabaseManger";
import { EventBus } from "../game/EventBus";
export class SceneManager {
    /**
     * (Alias) The table name of scenes
     */
    static TABLENAME = DatabaseManager.TABLENAME_SCENES;

    /**
     * The brief information of scenes
     */
    static scenesInfo: SceneInfo[] = [];

    /**
     * [Set] The brief information of scenes
     */
    static setScenesInfo: React.Dispatch<React.SetStateAction<SceneInfo[]>>;

    /**
     * The brief information of scene layers
     */
    static layersInfo: LayerInfo[] = [];

    /**
     * [Set] The brief information of scene layers
     */
    static setLayersInfo: React.Dispatch<React.SetStateAction<LayerInfo[]>>;

    /**
     * Update the brief information of scenes
     */
    static updateScenesInfo(callback?: () => void) {
        const trans = DatabaseManager.indexedDB.transaction(
            [SceneManager.TABLENAME],
            "readonly"
        );
        const table = trans.objectStore(SceneManager.TABLENAME);
        const openCursor = table.openCursor();
        const _scenesInfo: SceneInfo[] = [];
        openCursor.onsuccess = () => {
            const item = openCursor.result;
            if (item) {
                const scnenInfo: SceneInfo = {
                    id: item.primaryKey,
                    name: item.value.name,
                };
                _scenesInfo[item.value.id] = scnenInfo;
                item.continue();
            } else {
                SceneManager.setScenesInfo(_scenesInfo);
                // EventBus.emit("editor-init-over");

                // Callback
                if (callback) callback();
            }
        };
        openCursor.onerror = () => {
            console.error("Error: updateScenesInfo");
        };
    }

    /**
     * Update the brief information of layers
     * @param sceneId The id of the scene
     */
    static updateLayersInfo(sceneId: number) {
        const _layersInfo: LayerInfo[] = [];
        SceneManager.loadScene(sceneId, (database: SceneDatabase) => {
            if (database?.objects) {
                const objectDatas = database.objects as LayerData[];
                for (let i = 0; i < objectDatas.length; i++) {
                    if (
                        objectDatas[i].type != "layer" ||
                        objectDatas[i].subType != "tilemap"
                    )
                        continue;
                    _layersInfo[i] = {
                        id: objectDatas[i].id,
                        name: objectDatas[i].name,
                        type: objectDatas[i].type,
                    };
                }
            }
            SceneManager.setLayersInfo(_layersInfo);
        });
    }

    /**
     * [Async] Create a new scene
     * The primary key is id
     * @param sceneName The name of scene
     * @param width The width of scene
     * @param height The height of scene
     * @param id The index of scene. If the id has been used, the operation is invalidated
     */
    static createScene(
        sceneName: string = "abab",
        width: number = 40,
        height: number = 23,
        id?: number,
        callback?: () => void
    ) {
        // Create a transaction
        const trans = DatabaseManager.indexedDB.transaction(
            [SceneManager.TABLENAME],
            "readwrite"
        );

        // Get the table
        const table = trans.objectStore(SceneManager.TABLENAME);

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

                // Construct the layer data
                const layerData: LayerData = {
                    id: 0,
                    name: "New layer",
                    type: "layer",
                    subType: "tilemap",
                    depth: 0,
                    data: [] as number[][],
                };
                for (let i = 0; i < height; i++) {
                    layerData.data[i] = [];
                    for (let j = 0; j < width; j++) {
                        layerData.data[i][j] = 0;
                    }
                }

                // Construct the scene data
                const sceneData: SceneData = {
                    id: id != null ? id : newId,
                    name: sceneName,
                    objects: [layerData],
                };

                // Create the scene by id
                const addRequest = table.add(sceneData);
                addRequest.onsuccess = () => {
                    // Update information
                    SceneManager.updateScenesInfo(callback);
                };
            }
        };
    }

    // static getScenesNumber(): number {
    //     return 1;
    // }

    /**
     * Save the tilemap
     * @param id the id of the tilemap
     * @param layerId
     * @param _data the tileset data
     */
    static saveTileMap(
        id: number,
        layerId: number,
        _data: Phaser.Tilemaps.Tile[][]
    ) {
        // Get data
        const data: number[][] = [];
        for (let i = 0; i < _data.length; i++) {
            data[i] = [];
            for (let j = 0; j < _data[i].length; j++) {
                data[i][j] = _data[i][j].index;
            }
        }

        // Create a transaction
        const trans = DatabaseManager.indexedDB.transaction(
            [SceneManager.TABLENAME],
            "readwrite"
        );
        // Get the table
        const table = trans.objectStore(SceneManager.TABLENAME);

        let sceneData: SceneData;
        let layerData: LayerData;

        // Get the previous database
        const getReq = table.get(id);
        getReq.onsuccess = (event: Event) => {
            const target = event.target as IDBOpenDBRequest;
            const preDatabase = target.result as SceneDatabase;

            // Update database
            if (preDatabase) {
                sceneData = preDatabase;
                const objects = sceneData.objects;
                for (let i = 0; i < objects.length; i++) {
                    if (objects[i].id == layerId) {
                        layerData = objects[i] as LayerData;
                    }
                }
            } else {
                layerData = {
                    id: layerId,
                    name: "New layer",
                    type: "layer",
                    subType: "tilemap",
                    depth: 0,
                    data: [],
                };
                sceneData = {
                    id: id,
                    name: sceneData.name,
                    objects: [layerData],
                };
            }
            layerData.data = data;

            // Write database
            const putReq = table.put(sceneData);
            // table.
            // putReq.onsuccess = () => {};
        };
    }

    /**
     * Load the tilemap
     * @param id the id of the tilemap
     */
    static loadScene(id: number, callback: (_database: SceneDatabase) => void) {
        const trans = DatabaseManager.indexedDB.transaction(
            SceneManager.TABLENAME,
            "readonly"
        );
        const store = trans.objectStore(SceneManager.TABLENAME);
        const getReq = store.get(id);
        getReq.onsuccess = (event: Event) => {
            const target = event.target as IDBOpenDBRequest;
            const database = target.result as SceneDatabase;
            callback(database);
        };
        getReq.onerror = () => {
            console.error("Load scene error");
        };
    }

    static enableStoreLocally(): IDBFactory {
        return window.indexedDB;
    }
}
