import { SceneManager } from "../../managers/SceneManager";
import { Tabs, TabList, Tab, Icon, Divider } from "@chakra-ui/react";
import { PiNotePencil } from "react-icons/pi";
import { LuPaintBucket } from "react-icons/lu";

const Toolset = () => {
    // Paint pencil (paint one tile)
    const onPaintPencilClick = () => {
        SceneManager.currentToolsetIndex = SceneManager.toolset.PENCIL;
    };

    // Paint bucket (paint a connected area)
    const onPaintBucketClick = () => {
        SceneManager.currentToolsetIndex = SceneManager.toolset.BUCKET;
    };

    // Rendering
    return (
        <div className="flex justify-between h-16 px-4 pt-2 bg-white z-[1] relative opacity-85">
            <Tabs variant="unstyled">
                <TabList>
                    <Tab
                        _selected={{ color: "white", bg: "green.500" }}
                        onClick={onPaintPencilClick}
                    >
                        <Icon
                            aria-label="Paint a tile"
                            fontSize={24}
                            as={PiNotePencil}
                        />
                    </Tab>
                    <Tab
                        _selected={{ color: "white", bg: "green.500" }}
                        onClick={onPaintBucketClick}
                    >
                        <Icon
                            aria-label="Paint all tiles"
                            fontSize={24}
                            as={LuPaintBucket}
                        />
                    </Tab>
                </TabList>
            </Tabs>
            <Divider orientation="vertical" />
        </div>
    );
};

export default Toolset;
