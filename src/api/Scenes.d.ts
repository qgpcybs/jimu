export interface SceneDatabase extends IDBDatabase {
    id: number;
    name:string;
    layers: LayerData[];
}

export interface SceneData {
    id: number;
    name:string;
    layers: LayerData[];
}

export interface LayerData {
    id: number;
    name: string;
    type: string;
    data: number[][];
}

export interface SceneInfo {
    id: number | IDBValidKey;
    name: string;
}

export interface LayerInfo {
    id: number;
    name: string;
    type: string;
}

export interface SimpleTile {
    x: number;
    y: number;
    index: number;
}
