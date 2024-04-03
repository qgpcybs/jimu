export interface SceneDatabase extends IDBDatabase {
    data: number[][];
}

export interface SceneInfo {
    id: number | IDBValidKey;
    name: string;
}

export interface SimpleTile {
    x: number;
    y: number;
    index: number;
}
