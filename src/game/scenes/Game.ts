import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { SceneManager } from "../../managers/SceneManager";
import { EditorState } from "../../EditorState";
import { SceneDatabase, LayerData } from "../../api/Scenes";
import { LayerPainter } from "../../components/sceneEditor/LayerPainter";

export class Game extends Scene {
    sceneId: number;
    camera: Phaser.Cameras.Scene2D.Camera;

    // layers: Phaser.GameObjects.Layer[];

    layers: Phaser.Tilemaps.TilemapLayer[];
    tilemap: Phaser.Tilemaps.Tilemap;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    controls: Phaser.Cameras.Controls.FixedKeyControl;

    /**
     * Tile selection box displayed on the scene
     */
    selectedBox: Phaser.GameObjects.Graphics;

    /**
     * Example of the class to paint layers
     */
    layerPainter: LayerPainter;

    /**
     * Constructor
     */
    constructor() {
        super("Game");
    }

    /**
     * Init the scene
     * @param data id: sceneID
     */
    init(data = { id: 0 }) {
        this.sceneId = data.id;
        this.layers = [];
        this.layerPainter = new LayerPainter(this.sceneId);
        SceneManager.updateLayersInfo(this.sceneId);
    }

    /**
     * Auto handle after init
     */
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
                    tileWidth: database.tileSize,
                    tileHeight: database.tileSize,
                    data: data,
                }));

                // Load tilesets
                // TODO: get different tilesets
                const tilesPrimalPlateauGrass = tilemap.addTilesetImage(
                    "tiles-primal_plateau-grass"
                ) as Phaser.Tilemaps.Tileset;

                const tilemapLayer = tilemap.createLayer(0, [
                    tilesPrimalPlateauGrass,
                ]) as Phaser.Tilemaps.TilemapLayer;

                // Add to the array of layers
                this.layers[this.layers.length] = tilemapLayer;

                // Set the depth of this layer
                tilemapLayer.setDepth(objectData.depth);

                // Init painting records of this layer
                this.layerPainter.paintTilesRecord[objectData.id] = [];
            }
            // Final steps
            this.initSelectedBox(); // Init the selected box
            EventBus.emit("current-scene-ready", this); // Emit event: scene creation is complete
            this.onListener(); // Start listening to events
        });
    }

    /**
     * Init the selected box
     */
    initSelectedBox() {
        this.selectedBox = this.add.graphics();
        this.selectedBox.setDepth(9999);
        this.selectedBox.lineStyle(2, 0xffffff, 0.8);
        this.selectedBox.strokeRect(
            0,
            0,
            this.tilemap.tileWidth,
            this.tilemap.tileHeight
        );
    }

    /**
     * Automatically executed once per frame
     */
    update(): void {
        // Ensure the map has been loaded or created
        if (!this.tilemap || this.tilemap.layers.length < 1) return;

        // Ensure the focus is within the scene
        if (EditorState.currentFocus.current !== EditorState.widgetName.SCENE) {
            this.selectedBox.alpha = 0; // Hide the selected box
            return;
        }

        // Ensure not on dragging
        if (EditorState.onDragging) return;

        // Get current layer id
        const layerId = EditorState.currentLayerId;

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

        // Update tile selected box size and position
        if (deltaMoveXY.x != 0 || deltaMoveXY.y != 0) {
            this.onPointerMove(pointerWorldXY);
        }

        // Handle left button down
        if (this.input.manager.activePointer.primaryDown) {
            this.onPrimaryDown(layerId, pointerTileXY);
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
            this.layerPainter.updatePaletteTilesPos,
            this.layerPainter
        );

        this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonReleased()) {
                if (
                    this.layerPainter.paintTilesRecord[
                        EditorState.currentLayerId
                    ].slice(-1).length > 0
                )
                    this.layerPainter.latestPaintTilesRecordEntryIndex++;
            }
        });

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
                    this.layerPainter.undoTilemapPaint(
                        this.layers[EditorState.currentLayerId],
                        EditorState.currentLayerId
                    );
                }
            }
        });
    }

    /**
     * Handle the pointer move.
     * Action 1: move cursor;
     */
    onPointerMove(pointerWorldXY: Phaser.Math.Vector2 | null) {
        if (pointerWorldXY != null) {
            // Show the selected box
            this.selectedBox.alpha = 1;

            // Set the position
            this.selectedBox.setPosition(pointerWorldXY.x, pointerWorldXY.y);

            // Resize the selected box
            // TODO
        }
    }

    /**
     * Handle the primary button down.
     * Action 1: paint tiles;
     */
    onPrimaryDown(layerId: number, pointerTileXY: Phaser.Math.Vector2 | null) {
        // Ensure the painting conditions are okay
        if (
            !this.layerPainter.canTilemapPaint(
                layerId,
                pointerTileXY,
                this.tilemap.width,
                this.tilemap.height
            )
        )
            return;
        // Paint tiles according to the selected tool
        if (SceneManager.currentToolsetIndex === SceneManager.toolset.PENCIL) {
            // Pencil
            this.layerPainter.tilemapPencil(
                this.layers[layerId],
                layerId,
                pointerTileXY as Phaser.Math.Vector2
            );
        } else if (
            SceneManager.currentToolsetIndex === SceneManager.toolset.BUCKET
        ) {
            // Bucket
            this.layerPainter.tilemapBucket(
                this.layers[layerId],
                layerId,
                pointerTileXY as Phaser.Math.Vector2
            );
        }

        // Save to the database
        SceneManager.saveTileMap(
            this.sceneId,
            layerId,
            this.layers[layerId].layer.data
        );
    }
}
