export interface SceneDatabase extends IDBDatabase {
    id: number;
    name: string;
    width: number;
    height: number;
    tileSize: number;
    objects: ObejctData[];
}

export interface SceneData {
    id: number;
    name: string;
    width: number;
    height: number;
    tileSize: number;
    objects: ObejctData[];
}

export interface ObejctData {
    id: number;
    name: string;
    type: string;
    subType: string;
    depth: number;
    data: unknown;
}

export interface LayerData extends ObejctData {
    data: number[][];
}

export interface SceneInfo {
    id: number | IDBValidKey;
    name: string;
    width: number;
    height: number;
    tileSize: number;
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

export interface PaintHistory extends SimpleTile {
    layerId: number;
}
