import { FC, useState } from "react";
import Tile from "./Tile";
import ImageUploader from "../common/ImageUploader";

interface TilePaletteProps {
    onSelectTiles: (
        stX: number,
        stY: number,
        edX?: number,
        edY?: number
    ) => void;
}

const TilePalette: FC<TilePaletteProps> = ({ onSelectTiles }) => {
    const tiles = Array.from({ length: 26 * 26 });

    const [selectedList, setSelectedList] = useState<boolean[]>(
        new Array(26 * 26).fill(false)
    );

    const [boxingIndexStart, setBoxingIndexStart] = useState<number>(-1);

    const selectedTile = (index: number) => {
        const stColumn = index % 22;
        const stRow = Math.floor(index / 22);
        const newSelectedList = selectedList.map((s, i) => {
            if (i === index) return true;
            else return false;
        });
        setSelectedList(newSelectedList);
        onSelectTiles(stColumn, stRow); // Update Tile
    };

    const selectTilesStart = (index: number) => {
        setBoxingIndexStart(index);
        selectedTile(index);
    };

    const selectTilesOver = (index: number) => {
        selectedTiles(index);
    };

    const selectTilesEnd = () => {
        setBoxingIndexStart(-1);
    };

    const selectedTiles = (boxingIndexEnd: number) => {
        if (boxingIndexStart < 0 || boxingIndexEnd < 0) return;
        const stColumn = boxingIndexStart % 22;
        const stRow = Math.floor(boxingIndexStart / 22);
        const edColumn = boxingIndexEnd % 22;
        const edRow = Math.floor(boxingIndexEnd / 22);
        const leftTopColumn = Math.min(stColumn, edColumn);
        const leftTopRow = Math.min(stRow, edRow);
        const rightBottomColumn = Math.max(stColumn, edColumn);
        const rightBottomRow = Math.max(stRow, edRow);
        if (
            leftTopColumn === rightBottomColumn &&
            leftTopRow === rightBottomRow
        ) {
            onSelectTiles(leftTopColumn, leftTopRow);
        } else {
            const newSelectedList = selectedList.map((s, i) => {
                const iColumn = i % 22;
                const iRow = Math.floor(i / 22);
                if (
                    iColumn < leftTopColumn ||
                    iRow < leftTopRow ||
                    iColumn > rightBottomColumn ||
                    iRow > rightBottomRow
                )
                    return false;
                else return true;
            });
            setSelectedList(newSelectedList);
            onSelectTiles(
                leftTopColumn,
                leftTopRow,
                rightBottomColumn,
                rightBottomRow
            ); // Update Tile
        }
    };

    return (
        <div className="select-none ml-1">
            <div className="text-left my-2 mr-4 w-96">
                <span className="font-bold">Upload other tilesets</span>
                <ImageUploader />
            </div>

            <div className="text-left ">
                <span className="font-bold">Tileset</span>
                <div
                    className="grid grid-cols-[repeat(22,minmax(0,1rem))] gap-[0.125rem]"
                    onMouseUp={() => selectTilesEnd()}
                >
                    {tiles.map((_t, _i) => (
                        <div
                            key={_i}
                            onMouseDown={() => selectTilesStart(_i)}
                            onMouseOver={() => selectTilesOver(_i)}
                        >
                            <Tile index={_i} cursorVisible={selectedList[_i]} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TilePalette;
