import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { SceneManager } from "../../managers/SceneManager";
import { EditorState } from "../../EditorState";
import { SceneDatabase, LayerData, SimpleTile } from "../../api/Scenes";

export class Game extends Scene {
    sceneId: number;
    camera: Phaser.Cameras.Scene2D.Camera;
    // layers: Phaser.GameObjects.Layer[];
    layers: Phaser.Tilemaps.TilemapLayer[];
    tilemap: Phaser.Tilemaps.Tilemap;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    controls: Phaser.Cameras.Controls.FixedKeyControl;
    preDrawTile: Phaser.Math.Vector2;
    preDrawTile2: Phaser.Math.Vector2 | null;
    selectedBox: Phaser.GameObjects.Graphics;
    oldDrawPointerTileXY: Phaser.Math.Vector2 | null;
    oldDrawTiles: SimpleTile[][][];

    unDoing: boolean;
    isDrawAreaChanged: boolean;

    constructor() {
        super("Game");
    }

    init(data = { id: 0 }) {
        this.sceneId = data.id;
        this.layers = [];
        this.oldDrawTiles = [];
        SceneManager.updateLayersInfo(this.sceneId);
    }

    create() {
        // Getting from the database
        SceneManager.loadScene(this.sceneId, (database: SceneDatabase) => {
            // Get layers data
            for (let i = 0; i < database.objects.length; i++) {
                const objectData = database.objects[i] as LayerData;

                // Only load tilemap
                if (
                    objectData.type != "layer" ||
                    objectData.subType != "tilemap"
                )
                    continue;

                // Get the array of tiles data
                const data: number[][] = objectData.data;

                // Create the map
                const tilemap = (this.tilemap = this.make.tilemap({
                    tileWidth: 32,
                    tileHeight: 32,
                    data: data,
                }));

                // Load tilesets
                const tilesPrimalPlateauGrass = tilemap.addTilesetImage(
                    "tiles-primal_plateau-grass"
                ) as Phaser.Tilemaps.Tileset;

                const tilemapLayer = tilemap.createLayer(0, [
                    tilesPrimalPlateauGrass,
                ]) as Phaser.Tilemaps.TilemapLayer;

                const index = this.layers.length;
                this.layers[index] = tilemapLayer;
                tilemapLayer.setDepth(objectData.depth);

                // this.layers[index] = this.add.layer();
                // this.layers[index].add(tilemapLayer);

                // Init drawing record list
                this.oldDrawTiles[objectData.id] = [];
            }
            // Complete
            this.createCompleted();
        });

        // const tilesPrimalPlateauProps = this.map.addTilesetImage(
        //     "tiles-primal_plateau-props"
        // ) as Phaser.Tilemaps.Tileset;

        // this.objectLayer = this.map.createBlankLayer(
        //     "Object Layer",
        //     tilesPrimalPlateauProps
        // ) as Phaser.Tilemaps.TilemapLayer;
    }

    loadTilesets() {}

    /**
     * The last step of creating the scene
     */
    createCompleted() {
        // Init the selected box
        this.selectedBox = this.add.graphics();
        this.selectedBox.setDepth(9999);
        this.selectedBox.lineStyle(2, 0xffffff, 0.8);
        this.selectedBox.strokeRect(
            0,
            0,
            this.tilemap.tileWidth,
            this.tilemap.tileHeight
        );

        // Init drawing states
        this.isDrawAreaChanged = false;
        this.unDoing = false;

        // Emit & listen event
        EventBus.emit("current-scene-ready", this);
        this.onListener();
    }

    /**
     * Automatically executed once per frame
     */
    update(): void {
        // The map has been loaded or created
        if (!this.tilemap || this.tilemap.layers.length < 1) return;

        // console.log(this.children)

        // Update cursor position (e.g. tile selected box)
        const worldPoint = this.input.activePointer.positionToCamera(
            this.cameras.main
        ) as Phaser.Math.Vector2;

        const pointerTileXY = this.tilemap.worldToTileXY(
            worldPoint.x,
            worldPoint.y
        );

        const pointerWorldXY = pointerTileXY
            ? this.tilemap.tileToWorldXY(pointerTileXY.x, pointerTileXY.y)
            : new Phaser.Math.Vector2(0, 0);

        const deltaMoveXY = this.input.manager.activePointer.velocity;

        // Update selected box size and position
        if (deltaMoveXY.x != 0 || deltaMoveXY.y != 0) {
            this.onPointerMove(pointerWorldXY);
        }

        // User input
        if (
            EditorState.currentFocus.current === EditorState.widgetName.SCENE &&
            this.input.manager.activePointer.primaryDown
        ) {
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
                if (event.shiftKey) {
                    // Common Action: Redo
                    // TODO
                    console.log("Redo");
                } else {
                    // Common Action: Undo
                    console.log("Undo");
                    this.undoLastDraw();
                }
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
                pointerTileXY.x > this.tilemap.width ||
                pointerTileXY.y > this.tilemap.height ||
                pointerTileXY.x < 0 ||
                pointerTileXY.y < 0
            )
                return;
            // Don't draw when undoing
            if (this.unDoing) return;

            // Get tileset's size
            const currentLayerId = EditorState.currentLayerId;
            const tilemapLayer = this.layers[currentLayerId];
            const tilesetColumns = tilemapLayer.tileset[0].columns;
            const tilesetRows = tilemapLayer.tileset[0].rows;

            // Update old pointer
            this.oldDrawPointerTileXY = pointerTileXY;

            // Draw area used
            this.isDrawAreaChanged = false;

            // Each time save one action of drawing old tiles
            const oldDrawTilesTime = this.oldDrawTiles[currentLayerId].length;
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
                                pastDrawX < this.tilemap.width &&
                                pastDrawY < this.tilemap.height
                            ) {
                                // Position must inside the map
                                console.log(
                                    this.oldDrawTiles[currentLayerId][
                                        oldDrawTilesTime
                                    ]
                                );
                                if (
                                    this.oldDrawTiles[currentLayerId][
                                        oldDrawTilesTime
                                    ] === undefined
                                )
                                    this.oldDrawTiles[currentLayerId][
                                        oldDrawTilesTime
                                    ] = [];
                                this.oldDrawTiles[currentLayerId][
                                    oldDrawTilesTime
                                ].push({
                                    x: pastDrawX,
                                    y: pastDrawY,
                                    index: tilemapLayer.layer.data[pastDrawY][
                                        pastDrawX
                                    ].index,
                                });
                            }
                        }
                    }
                }
                // Draw the area
                tilemapLayer.putTilesAt(
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
                    this.oldDrawTiles[currentLayerId][oldDrawTilesTime] = [];
                    this.oldDrawTiles[currentLayerId][oldDrawTilesTime].push({
                        x: pointerTileXY.x,
                        y: pointerTileXY.y,
                        index: tilemapLayer.layer.data[pointerTileXY.y][
                            pointerTileXY.x
                        ].index,
                    });
                    // Draw the tile
                    tilemapLayer.putTileAt(
                        finDrawTileIndex,
                        pointerTileXY.x,
                        pointerTileXY.y
                    );
                }
            }

            // Save to the database
            SceneManager.saveTileMap(
                this.sceneId,
                currentLayerId,
                tilemapLayer.layer.data
            );
        }
    }

    undoLastDraw() {
        if (this.unDoing) return;
        this.unDoing = true;

        const currentLayerId = EditorState.currentLayerId;

        const currentOldDrawTiles = this.oldDrawTiles[currentLayerId].pop();

        const tilemapLayer = this.layers[currentLayerId];

        if (currentOldDrawTiles) {
            for (let i = 0; i < currentOldDrawTiles.length; i++) {
                tilemapLayer.putTileAt(
                    currentOldDrawTiles[i].index,
                    currentOldDrawTiles[i].x,
                    currentOldDrawTiles[i].y
                );
            }
        }
        // Save to the database
        SceneManager.saveTileMap(this.sceneId, 0, tilemapLayer.layer.data);
        this.unDoing = false;
    }
}
