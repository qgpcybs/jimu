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
    static updateScenesInfo() {
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
                EventBus.emit("editor-init-over");
            }
        };
        openCursor.onerror = () => {
            console.log("Error: updateScenesInfo");
        };
    }

    /**
     * Update the brief information of layers
     * @param sceneId The id of the scene
     */
    static updateLayersInfo(sceneId: number) {
        const _layersInfo: LayerInfo[] = [];
        const getReq = SceneManager.loadScene(sceneId);
        getReq.onsuccess = (event: Event) => {
            const target = event.target as IDBOpenDBRequest;
            const database = target.result as SceneDatabase;
            if (database?.layers) {
                const layerData = database.layers;
                for (let i = 0; i < layerData.length; i++) {
                    _layersInfo[i] = {
                        id: layerData[i].id,
                        name: layerData[i].name,
                        type: layerData[i].type,
                    };
                }
            }
            SceneManager.setLayersInfo(_layersInfo);
        };
        getReq.onerror = () => {
            console.log("Error: updateLayersInfo");
        };
    }

    /**
     * [Async] Create a new scene
     * The primary key is id
     * @param sceneName The name of scene
     * @param width The width of scene
     * @param height The height of scene
     */
    static createScene(
        sceneName: string = "abab",
        width: number = 40,
        height: number = 23
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
                    type: "tilemap",
                    data: [] as number[][],
                };
                for (let i = 0; i < height; i++) {
                    layerData.data[i] = [];
                    for (let j = 0; j < width; j++) {
                        layerData.data[i][j] = 32;
                    }
                }

                // Construct the scene data
                const sceneData: SceneData = {
                    id: newId,
                    name: sceneName,
                    layers: [layerData],
                };

                // Create the scene by id
                table.add(sceneData);

                // Update information
                SceneManager.updateScenesInfo();
            }
        };
    }

    static getScenesNumber(): number {
        return 1;
    }

    /**
     * Save the tilemap
     * @param id the id of the tilemap
     * @param layerId
     * @param data the tileset data
     */
    static saveTileMap(id: number, layerId: number, data: number[][]) {
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
                layerData = sceneData.layers[layerId];
            } else {
                layerData = {
                    id: layerId,
                    name: "aaa",
                    type: "tilemap",
                    data: [],
                };
                sceneData = { id: id, layers: [layerData] };
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
     * @returns the tileset data
     */
    static loadScene(id: number): IDBRequest {
        const trans = DatabaseManager.indexedDB.transaction(
            SceneManager.TABLENAME,
            "readonly"
        );
        const store = trans.objectStore(SceneManager.TABLENAME);
        return store.get(id);
    }

    static enableStoreLocally(): IDBFactory {
        return window.indexedDB;
    }
}
