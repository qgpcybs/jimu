import { SimpleTile } from "../../api/Scenes";
import { SceneManager } from "../../managers/SceneManager";

export class LayerPainter {
    /**
     * The id of the scene work for
     */
    sceneId: number;

    /**
     * The coords of tile selected in palette, or the top-left tile if more than one is selected at the same time
     */
    paletteTilePos: Phaser.Math.Vector2;

    /**
     * The coords of bottom-right tile selected in palette, or null if only one tile is selected
     */
    paletteTilePos2: Phaser.Math.Vector2 | null;

    /**
     * Whether or not painting, including undo & redo
     */
    isPainting: boolean;

    /**
     * Historical records of tiles painting, mainly used for undo.
     * 1st dimension: layer id;
     * 2nd dimension: entry index;
     * 3rd dimension: tiles data.
     */
    paintTilesRecord: SimpleTile[][][];

    /**
     * the lastest entry index of paintTilesRecord
     */
    latestPaintTilesRecordEntryIndex: number;

    /**
     * Init
     */
    constructor(sceneId: number) {
        // init painting states
        this.sceneId = sceneId;
        this.isPainting = false;
        this.paintTilesRecord = [];
        this.latestPaintTilesRecordEntryIndex = 0;
    }

    /**
     * Whether the painting of the tilemap is legal or not
     */
    canTilemapPaint(
        layerId: number,
        pointerTileXY: Phaser.Math.Vector2 | null,
        tilemapWidth: number,
        tilemapHeight: number
    ): boolean {
        // Ensure the tile to be painted exists
        if (pointerTileXY == null) return false;

        // Ensure at least one tile of the palette is selected
        if (this.paletteTilePos == null) return false;

        // // Avoid duplicate painting
        // const previousPaintedLayerTile =
        //     this.paintTilesRecord[layerId]?.slice(-1)[0]?.[0];
        // if (
        //     previousPaintedLayerTile &&
        //     previousPaintedLayerTile.x === pointerTileXY.x &&
        //     previousPaintedLayerTile.y === pointerTileXY.y
        // )
        //     return false;

        // Avoid exceeding the tilemap
        if (
            pointerTileXY.x > tilemapWidth ||
            pointerTileXY.x < 0 ||
            pointerTileXY.y > tilemapHeight ||
            pointerTileXY.y < 0
        )
            return false;

        // Avoid the last painting or undoing or redoing not yet completed
        if (this.isPainting) return false;

        // Allow to paint
        return true;
    }

    /**
     * Update prepare paint tiles
     */
    updatePaletteTilesPos(
        topLeftX: number,
        topLeftY: number,
        bottomRightX?: number,
        bottomRightY?: number
    ) {
        // Update by the left-top tile
        this.paletteTilePos = new Phaser.Math.Vector2(topLeftX, topLeftY);

        // Update by the right-bottom tile
        this.paletteTilePos2 =
            bottomRightX != null && bottomRightY != null
                ? new Phaser.Math.Vector2(bottomRightX, bottomRightY)
                : null;
    }

    /**
     * Tilemap Pencil: Paint one tile
     */
    tilemapPencil(
        tilemapLayer: Phaser.Tilemaps.TilemapLayer,
        layerId: number,
        pointerTileXY: Phaser.Math.Vector2
    ) {
        // Mark the start
        this.isPainting = true;

        // Get the size of tileset (TempCode)
        const tilesetColumns = tilemapLayer.tileset[0].columns;
        const tilesetRows = tilemapLayer.tileset[0].rows;

        // Get the coordinates of the top-left & bottom-right tile in the selected tiles
        const topLeftX = this.paletteTilePos.x;
        const topLeftY = this.paletteTilePos.y;
        const bottomRightX = this.paletteTilePos2
            ? this.paletteTilePos2.x
            : topLeftX;
        const bottomRightY = this.paletteTilePos2
            ? this.paletteTilePos2.y
            : topLeftY;

        // Correct the area to be painted based on the extent of the tileset
        const actualbottomRightX = Math.min(bottomRightX, tilesetColumns - 1);
        const actualbottomRightY = Math.min(bottomRightY, tilesetRows - 1);

        // Get the index of the latest empty record
        const entryIndex = this.latestPaintTilesRecordEntryIndex;

        // Initialize the list of indexes in the tileset for tiles to be painted
        const paletteTileIndexes: number[][] = [];

        // Pre-processing of all tiles to be painted
        for (let i = topLeftY; i <= actualbottomRightY; i++) {
            paletteTileIndexes[i - topLeftY] = []; // Initialize one row of the list
            for (let j = topLeftX; j <= actualbottomRightX; j++) {
                const layerTileX = pointerTileXY.x + j - topLeftX;
                const layerTileY = pointerTileXY.y + i - topLeftY;
                if (
                    layerTileX >= tilemapLayer.tilemap.width ||
                    layerTileY >= tilemapLayer.tilemap.height
                )
                    continue; // Ignored if out of range of tilemap
                paletteTileIndexes[i - topLeftY].push(tilesetColumns * i + j); // Add to the list
                if (!this.paintTilesRecord[layerId][entryIndex])
                    this.paintTilesRecord[layerId][entryIndex] = []; // Initialize the new entry of record
                this.paintTilesRecord[layerId][entryIndex].push({
                    x: layerTileX,
                    y: layerTileY,
                    index: tilemapLayer.layer.data[layerTileY][layerTileX]
                        .index,
                }); // Add to the record
            }
        }

        // Paint
        tilemapLayer.putTilesAt(
            paletteTileIndexes,
            pointerTileXY.x,
            pointerTileXY.y
        );

        // Mark the finish
        this.isPainting = false;
    }

    /**
     * Tilemap Pencil: Paint tiles in an connected area
     */
    tilemapBucket(
        tilemapLayer: Phaser.Tilemaps.TilemapLayer,
        layerId: number,
        pointerTileXY: Phaser.Math.Vector2
    ) {
        // TODO
    }

    /**
     * Undo tilemap painting
     */
    undoTilemapPaint(
        tilemapLayer: Phaser.Tilemaps.TilemapLayer,
        layerId: number
    ) {
        if (this.isPainting) return;
        const tiles = this.paintTilesRecord[layerId]?.pop(); // Latest entry
        if (!tiles) return;
        this.isPainting = true;
        for (let i = tiles.length - 1; i >= 0; i--) {
            tilemapLayer.putTileAt(tiles[i].index, tiles[i].x, tiles[i].y);
        }
        SceneManager.saveTileMap(
            this.sceneId,
            layerId,
            tilemapLayer.layer.data
        ); // Save to the database
        this.isPainting = false;
    }
}
