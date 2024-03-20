export interface SceneDatabase extends IDBDatabase {
    data: string;
}

export interface SimpleTile {
    x: number;
    y: number;
    index: number;
}
