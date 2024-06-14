import { memo } from "react";

function Tile({
    index,
    cursorVisible,
    src,
}: {
    index: number;
    cursorVisible: boolean;
    src: string;
}) {
    return (
        <div className="tileContent relative w-4 h-4 overflow-clip rounded-sm">
            <span className="absolute z-20">{cursorVisible}</span>
            <img
                className="absolute max-w-none z-10"
                src="./assets/tilemaps/default/TilesetFloor.png"
                draggable="false"
                style={{
                    top: -Math.floor(index / 22) * 16,
                    left: -(index % 22) * 16,
                }}
            />
            <img
                className={`absolute z-30 left-0 top-0 ${
                    cursorVisible ? "" : "hidden"
                }`}
                draggable="false"
                src="./assets/cursor.png"
            />
        </div>
    );
}
const MemoizedTile = memo(Tile);
export default MemoizedTile;
