import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { SceneManager } from "../../managers/SceneManager";
import { SceneDatabase, SimpleTile } from "../../api/Scenes";

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    map: Phaser.Tilemaps.Tilemap;
    objectLayer: Phaser.Tilemaps.TilemapLayer;
    groundLayer: Phaser.Tilemaps.TilemapLayer;
    controls: Phaser.Cameras.Controls.FixedKeyControl;
    preDrawTile: Phaser.Math.Vector2;
    preDrawTile2: Phaser.Math.Vector2 | null;
    selectedBox: Phaser.GameObjects.Graphics;
    oldDrawPointerTileXY: Phaser.Math.Vector2 | null;
    oldDrawTiles: SimpleTile[][];
    unDoing: boolean;
    isDrawAreaChanged: boolean;

    constructor() {
        super("Game");
    }

    create() {
        // Getting from the database
        const getReq = SceneManager.loadTilemap("groundLayer");
        getReq.onsuccess = (event: Event) => {
            const target = event.target as IDBOpenDBRequest;
            const database = target.result as SceneDatabase;
            if (database) {
                this.createFromDatabase(JSON.parse(database.data));
            } else {
                this.createNew();
            }

            // const tilesPrimalPlateauProps = this.map.addTilesetImage(
            //     "tiles-primal_plateau-props"
            // ) as Phaser.Tilemaps.Tileset;

            // this.objectLayer = this.map.createBlankLayer(
            //     "Object Layer",
            //     tilesPrimalPlateauProps
            // ) as Phaser.Tilemaps.TilemapLayer;
        };
        getReq.onerror = () => {
            console.error("create scene error: getReq");
        };
    }

    /**
     * Init a new scene
     */
    createNew() {
        // Create the map
        const mapTileSize: number = 32;
        const mapWidth: number = 40;
        const mapHeight: number = 23;
        this.map = this.make.tilemap({
            tileWidth: mapTileSize,
            tileHeight: mapTileSize,
            width: mapWidth,
            height: mapHeight,
        });

        // Load tilesets
        const tilesPrimalPlateauGrass = this.map.addTilesetImage(
            "tiles-primal_plateau-grass"
        ) as Phaser.Tilemaps.Tileset;

        this.groundLayer = this.map.createBlankLayer("Ground Layer", [
            tilesPrimalPlateauGrass,
        ]) as Phaser.Tilemaps.TilemapLayer;

        // Init with tile 0
        this.groundLayer.fill(0, 0, 0, this.map.width, this.map.height);

        // Complete
        this.createCompleted();
    }

    /**
     * Load an existed scene
     * @param data An array of tiles data
     */
    createFromDatabase(data: number[][]) {
        // Create the map
        this.map = this.make.tilemap({
            data: data,
            tileWidth: 32,
            tileHeight: 32,
        });

        // Load tilesets
        const tilesPrimalPlateauGrass = this.map.addTilesetImage(
            "tiles-primal_plateau-grass"
        ) as Phaser.Tilemaps.Tileset;

        this.groundLayer = this.map.createLayer(0, [
            tilesPrimalPlateauGrass,
        ]) as Phaser.Tilemaps.TilemapLayer;

        // Complete
        this.createCompleted();
    }

    loadTilesets() {}

    /**
     * The last step of creating the scene
     */
    createCompleted() {
        // Init the selected box
        this.selectedBox = this.add.graphics();
        this.selectedBox.lineStyle(2, 0xffffff, 0.8);
        this.selectedBox.strokeRect(
            0,
            0,
            this.map.tileWidth,
            this.map.tileHeight
        );

        // Init drawing states
        this.isDrawAreaChanged = false;
        this.unDoing = false;

        // Init drawing record list
        this.oldDrawTiles = [];

        // Emit & listen event
        EventBus.emit("current-scene-ready", this);
        this.onListener();
    }

    /**
     * Automatically executed once per frame
     */
    update(): void {
        if (!this.map) return;
        // Update cursor position (e.g. tile selected box)
        const worldPoint = this.input.activePointer.positionToCamera(
            this.cameras.main
        ) as Phaser.Math.Vector2;

        const pointerTileXY = this.map.worldToTileXY(
            worldPoint.x,
            worldPoint.y
        );

        const pointerWorldXY = pointerTileXY
            ? this.map.tileToWorldXY(pointerTileXY.x, pointerTileXY.y)
            : new Phaser.Math.Vector2(0, 0);

        const deltaMoveXY = this.input.manager.activePointer.velocity;

        // Update selected box size and position
        if (deltaMoveXY.x != 0 || deltaMoveXY.y != 0) {
            this.onPointerMove(pointerWorldXY);
        }

        // User input
        if (this.input.manager.activePointer.primaryDown) {
            this.onPrimaryDown(pointerTileXY);
        }
    }

    changeScene() {
        this.scene.start("GameOver");
    }

    /**
     * Listening after the scene is created
     */
    onListener() {
        // Receive tile Index
        EventBus.on(
            "paint-tiles",
            (stX: number, stY: number, edX?: number, edY?: number) => {
                if (
                    this.preDrawTile &&
                    this.preDrawTile.x == stX &&
                    this.preDrawTile.y == stY &&
                    this.preDrawTile2 &&
                    edX &&
                    edY &&
                    this.preDrawTile2.x == edX &&
                    this.preDrawTile2.y == edY
                )
                    return;
                // Update tiles
                this.preDrawTile = new Phaser.Math.Vector2(stX, stY);
                if (edX && edY && edX > 0 && edY > 0) {
                    this.preDrawTile2 = new Phaser.Math.Vector2(edX, edY);
                } else this.preDrawTile2 = null;
                this.isDrawAreaChanged = true;
            }
        );

        this.input.keyboard?.on("keydown-Z", (event: KeyboardEvent) => {
            // Input: Ctrl + Z
            if (event.ctrlKey) {
                console.log("后退");
                // Common Action: Undo
                this.undoLastDraw();
            }
        });
    }

    // Common Action: Move cursor
    onPointerMove(pointerWorldXY: Phaser.Math.Vector2 | null) {
        if (pointerWorldXY != null) {
            this.selectedBox.setPosition(pointerWorldXY.x, pointerWorldXY.y);
        }
    }

    // Create Action: Draw tile
    onPrimaryDown(pointerTileXY: Phaser.Math.Vector2 | null) {
        // Tile index transform & Draw tile
        if (pointerTileXY != null && this.preDrawTile) {
            // Don't draw the same tile
            if (
                this.oldDrawPointerTileXY &&
                this.oldDrawPointerTileXY.x == pointerTileXY.x &&
                this.oldDrawPointerTileXY.y == pointerTileXY.y &&
                !this.isDrawAreaChanged
            )
                return;
            // Don't draw over tilemap
            if (
                pointerTileXY.x > this.map.width ||
                pointerTileXY.y > this.map.height ||
                pointerTileXY.x < 0 ||
                pointerTileXY.y < 0
            )
                return;
            // Don't draw when undoing
            if (this.unDoing) return;

            // Get tileset's size
            const tilesetColumns = this.groundLayer.tileset[0].columns;
            const tilesetRows = this.groundLayer.tileset[0].rows;

            // Update old pointer
            this.oldDrawPointerTileXY = pointerTileXY;

            // Draw area used
            this.isDrawAreaChanged = false;

            // Each time save one action of drawing old tiles
            const oldDrawTilesTime = this.oldDrawTiles.length;
            const currentOldDrawTiles: SimpleTile[] = (this.oldDrawTiles[
                oldDrawTilesTime
            ] = []);

            if (this.preDrawTile2) {
                // The 2st tile means to draw an area
                const finDrawTilesIndex: number[][] = [];
                for (
                    let i = this.preDrawTile.y;
                    i <= this.preDrawTile2.y;
                    i++
                ) {
                    for (
                        let j = this.preDrawTile.x;
                        j <= this.preDrawTile2.x;
                        j++
                    ) {
                        const finDrawTileIndex = i * tilesetColumns + j;
                        if (
                            j < tilesetColumns &&
                            finDrawTileIndex < tilesetColumns * tilesetRows
                        ) {
                            // It's not the line of the tilemap
                            const currentLine = i - this.preDrawTile.y;
                            // Init a new line or add to an exist line in array
                            if (!finDrawTilesIndex[currentLine])
                                finDrawTilesIndex[currentLine] = [];
                            // Add to the list of ready to draw
                            finDrawTilesIndex[currentLine].push(
                                finDrawTileIndex
                            );
                            // Add to the record of past drawing
                            const pastDrawX =
                                pointerTileXY.x + j - this.preDrawTile.x;
                            const pastDrawY =
                                pointerTileXY.y + i - this.preDrawTile.y;
                            if (
                                pastDrawX < this.map.width &&
                                pastDrawY < this.map.height
                            ) {
                                // Position must inside the map
                                currentOldDrawTiles.push({
                                    x: pastDrawX,
                                    y: pastDrawY,
                                    index: this.groundLayer.layer.data[
                                        pastDrawY
                                    ][pastDrawX].index,
                                });
                            }
                        }
                    }
                }
                // Draw the area
                this.groundLayer.putTilesAt(
                    finDrawTilesIndex,
                    pointerTileXY.x,
                    pointerTileXY.y
                );
            } else {
                // Means just draw one tile
                const finDrawTileIndex =
                    this.preDrawTile.y * tilesetColumns + this.preDrawTile.x;
                if (
                    this.preDrawTile.x < tilesetColumns &&
                    finDrawTileIndex < tilesetColumns * tilesetRows
                ) {
                    // Add to the record of past drawing
                    currentOldDrawTiles.push({
                        x: pointerTileXY.x,
                        y: pointerTileXY.y,
                        index: this.groundLayer.layer.data[pointerTileXY.y][
                            pointerTileXY.x
                        ].index,
                    });
                    // Draw the tile
                    this.groundLayer.putTileAt(
                        finDrawTileIndex,
                        pointerTileXY.x,
                        pointerTileXY.y
                    );
                }
            }

            // Save to the database
            const output = this.groundLayer.layer.data;
            const input: number[][] = [];
            for (let i = 0; i < output.length; i++) {
                input[i] = [];
                for (let j = 0; j < output[i].length; j++) {
                    input[i][j] = output[i][j].index;
                }
            }
            SceneManager.saveTileMap("groundLayer", JSON.stringify(input));
        }
    }

    undoLastDraw() {
        if (this.unDoing) return;
        this.unDoing = true;
        const currentOldDrawTiles = this.oldDrawTiles.pop();
        if (currentOldDrawTiles) {
            for (let i = 0; i < currentOldDrawTiles.length; i++) {
                console.log(currentOldDrawTiles[i]);
                this.groundLayer.putTileAt(
                    currentOldDrawTiles[i].index,
                    currentOldDrawTiles[i].x,
                    currentOldDrawTiles[i].y
                );
            }
        }
        this.unDoing = false;
    }
}
