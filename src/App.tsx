import { useRef, useState, useEffect } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import TilePalette from "./components/sceneEditor/TilePalette";
import { EventBus } from "./game/EventBus";
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
    Button,
    List,
    ListItem,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { SceneInfo } from "./api/Scenes";
import { SceneManager } from "./managers/SceneManager";
import { DatabaseManager } from "./managers/DatabaseManger";

/**
 * Entrance function
 */
function App() {
    // Init the Jimu Editor
    const editorInit = () => {
        // Open database
        DatabaseManager.init(() => {
            // Get scenes infomation
            SceneManager.updateScenesInfo();
        });
    };

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Scenes Info
    [SceneManager.scenesInfo, SceneManager.setScenesInfo] = useState<
        SceneInfo[]
    >([]);

    // Event emitted from the PhaserGame component
    const [currentScene, setCurrentScene] = useState<Phaser.Scene>();

    const currentSceneFunc = (_scene: Phaser.Scene) => {
        setCurrentScene(_scene);
    };

    const handleSelectTiles = (
        stX: number,
        stY: number,
        edX?: number,
        edY?: number
    ) => {
        EventBus.emit("paint-tiles", stX, stY, edX, edY);
    };

    useEffect(() => {
        // Init Jimu
        editorInit();
    }, []);

    return (
        <div id="app">
            <div id="topBar" className="h-24"></div>
            <div
                id="mainContent"
                className="flex flex-row w-screen bg-white h-[calc(100vh-6rem)]"
            >
                <div className="absolute z-0 pl-48">
                    <div id="projectArea" className="">
                        <PhaserGame
                            ref={phaserRef}
                            currentActiveScene={currentSceneFunc}
                        />
                    </div>
                </div>
                <div className="min-w-48 flex-col flex bg-white bg-opacity-75 z-[1]">
                    <Accordion defaultIndex={[0]} allowMultiple>
                        <AccordionItem>
                            <AccordionButton>
                                <Box as="span" flex="1" textAlign="left">
                                    Scenes
                                </Box>
                                <AddIcon
                                    boxSize={3}
                                    marginRight={1}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        SceneManager.createScene();
                                    }}
                                />
                                <AccordionIcon marginLeft={1} />
                            </AccordionButton>
                            <AccordionPanel>
                                <List spacing={2}>
                                    {SceneManager.scenesInfo.map((_t, _i) => (
                                        <ListItem key={_i}>
                                            <Button
                                                colorScheme="teal"
                                                variant="outline"
                                                onClick={() => {
                                                    currentScene?.scene.start(
                                                        "Game",
                                                        {
                                                            id: _i,
                                                        }
                                                    );
                                                }}
                                            >
                                                Scene1
                                            </Button>
                                        </ListItem>
                                    ))}
                                </List>
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                </div>
                <div
                    id="rightContent"
                    className="absolute right-0 text-right flex bg-white bg-opacity-75 z-[1]"
                >
                    <div className="w-[32rem] h-[64rem]">
                        <TilePalette onSelectTiles={handleSelectTiles} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
