import { v4 as uuidv4 } from "uuid";

export interface AssetInfo {
    uuid: uuidv4;
    name: string;
    type: string;
    subType: string;
    width: number;
    height: number;
}

export interface Asset extends AssetInfo {
    data: string | ArrayBuffer;
}
