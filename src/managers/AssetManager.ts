import { AssetInfo, Asset } from "../api/Assets";
import { DatabaseManager } from "./DatabaseManager";
import { v4 as uuidv4 } from "uuid";

export class AssetManager {
    /**
     * (Alias) The table name of assets
     */
    static TABLENAME = DatabaseManager.TABLENAME_ASSETS;

    /**
     * The brief information of assets
     */
    static assetInfos: AssetInfo[] = [];

    /**
     * [Set] The brief information of assets
     */
    static setAssetInfos: React.Dispatch<React.SetStateAction<AssetInfo[]>>;

    /**
     * Type of an asset
     */
    static type = {
        IMAGE: "Image",
    };

    /**
     * Sub type of an asset
     */
    static subType = {
        TILESET: "Tileset",
    };

    /**
     * Import new asset to database
     * @param name asset name
     * @param data asset data
     */
    static importAsset(
        name: string,
        width: number,
        height: number,
        data: string | ArrayBuffer,
        subType: string
    ) {
        return new Promise((resolve, reject) => {
            const trans = DatabaseManager.indexedDB.transaction(
                AssetManager.TABLENAME,
                "readwrite"
            );
            const table = trans.objectStore(AssetManager.TABLENAME);

            // Create asset object
            const asset: Asset = {
                uuid: uuidv4(),
                name: name,
                type: AssetManager.type.IMAGE,
                subType: subType,
                width: width,
                height: height,
                data: data,
            };

            // Add to indexedDB
            const addRequest = table.add(asset);
            addRequest.onsuccess = () => {
                resolve(true);
            };
            addRequest.onerror = () => {
                console.error("Failed to import asset to indexedDB");
                reject(addRequest.error);
            };
        });
    }
}
