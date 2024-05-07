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
    Stack,
    Tabs,
    TabList,
    Tab,
    Menu,
    MenuList,
    MenuItem,
    forwardRef,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import Draggable from "react-draggable";
import { SceneInfo, LayerInfo } from "./api/Scenes";
import { EditorState } from "./EditorState";
import { SceneManager } from "./managers/SceneManager";
import { DatabaseManager } from "./managers/DatabaseManger";

/**
 * Entrance function
 */
function App() {
    //================================================================
    // ■ Define
    //================================================================
    // Which part of Jimu in foucs now
    EditorState.currentFocus = useRef<string>("");

    // Scene draggable node ref
    const sceneNodeRef = useRef(null);

    // Scene list menu switch
    const [sceneListMenuShow, setSceneListMenuShow] = useState<boolean>(false);

    // Scene list focus
    const [sceneListFocus, setSceneListFocus] = useState<boolean>(false);

    // Scene list menu ref
    const sceneListMenuRef = forwardRef((props, ref) => (
        <div ref={ref} {...props}></div>
    ));

    // Scene list menu position
    const [sceneListMenuPosition, setSceneListMenuPosition] = useState({
        x: 0,
        y: 0,
    });

    // References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Scenes information
    [SceneManager.scenesInfo, SceneManager.setScenesInfo] = useState<
        SceneInfo[]
    >([]);

    // Current scene
    const [currentScene, setCurrentScene] = useState<Phaser.Scene>();

    // Current sceneId
    [EditorState.currentSceneId, EditorState.setCurrentSceneId] =
        useState<number>(0);

    // Layers information
    [SceneManager.layersInfo, SceneManager.setLayersInfo] = useState<
        LayerInfo[]
    >([]);

    // Current layer ID
    [EditorState.currentLayerId, EditorState.setCurrentLayerId] =
        useState<number>(0);

    // Current Object
    // TODO

    //================================================================
    // ■ Function
    //================================================================
    // Init the Jimu Editor
    const editorInit = () => {
        // Open database
        DatabaseManager.init(() => {
            // Get scenes information
            SceneManager.updateScenesInfo(() => {
                // Have any scenes been created?
                if (SceneManager.scenesInfo.length < 1) {
                    SceneManager.createScene("New Scene", 40, 23, 0, () => {
                        EventBus.emit("editor-init-over");
                    });
                } else {
                    EventBus.emit("editor-init-over");
                }
            });
        });
    };

    // Switch scenes (Temp)
    const currentSceneFunc = (_scene: Phaser.Scene) => {
        setCurrentScene(_scene);
    };

    // // Switch scene layers
    // const currentLayerFunc = (_layer: Phaser.GameObjects.Layer) => {
    //     setCurrentLayer(_layer);
    // };

    // Paint tiles
    const handleSelectTiles = (
        stX: number,
        stY: number,
        edX?: number,
        edY?: number
    ) => {
        EventBus.emit("paint-tiles", stX, stY, edX, edY);
    };

    //================================================================
    // ■ Init
    //================================================================
    useEffect(() => {
        // Init Jimu
        editorInit();
    }, []);

    //================================================================
    // ■ Rendering
    //================================================================
    return (
        <div
            id="app"
            onContextMenu={(e) => {
                e.preventDefault();
            }}
        >
            <div id="topBar" className="flex h-12">
                <div className="pt-3 z-[1] w-screen bg-white bg-opacity-85">
                    <span className="ml-4 ">
                        <a href="https://github.com/qgpcybs/jimu">
                            Jimu v0.0.1 - An open source editor
                        </a>
                    </span>
                </div>
            </div>
            <div
                id="mainContent"
                className="flex flex-row w-screen bg-white h-[calc(100vh-6rem)]"
            >
                <div className="absolute z-0 pl-48 max-w-[100vw] overflow-clip">
                    <Draggable
                        allowAnyClick
                        useMiddleButton
                        nodeRef={sceneNodeRef}
                        onStart={() => {
                            EditorState.onDragging = true;
                        }}
                        onStop={() => {
                            EditorState.onDragging = false;
                        }}
                    >
                        <div
                            id="projectArea"
                            ref={sceneNodeRef}
                            className=""
                            onMouseEnter={() => {
                                EditorState.currentFocus.current =
                                    EditorState.widgetName.SCENE;
                            }}
                        >
                            <PhaserGame
                                ref={phaserRef}
                                currentActiveScene={currentSceneFunc}
                            />
                        </div>
                    </Draggable>
                </div>

                <div
                    className="min-w-48 flex-col flex bg-white bg-opacity-85 z-[1]"
                    onMouseEnter={() => {
                        EditorState.currentFocus.current =
                            EditorState.widgetName.LEFT_CONTENT;
                    }}
                >
                    <Accordion defaultIndex={[0, 1]} allowMultiple>
                        {/* Scenes list */}
                        <AccordionItem id="scenesList">
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
                                <Menu
                                    isLazy
                                    isOpen={sceneListMenuShow}
                                    closeOnBlur={!sceneListFocus}
                                    onClose={() => {
                                        setSceneListMenuShow(false);
                                        console.log("close");
                                    }}
                                >
                                    <Tabs
                                        defaultIndex={
                                            EditorState.currentSceneId
                                        } // TODO
                                        variant="soft-rounded"
                                        colorScheme="green"
                                        isManual
                                        overflow={"auto"}
                                        onMouseEnter={() => {
                                            setSceneListFocus(true);
                                        }}
                                        onMouseLeave={() => {
                                            setSceneListFocus(false);
                                        }}
                                    >
                                        <TabList>
                                            <Stack width="100%" spacing={0}>
                                                {SceneManager.scenesInfo.map(
                                                    (_t, _i) => (
                                                        <Tab
                                                            key={_i}
                                                            tabIndex={Number(
                                                                _t.id
                                                            )}
                                                            height={8}
                                                            justifyContent={
                                                                "left"
                                                            }
                                                            borderRadius="md"
                                                            cursor="default"
                                                            _hover={
                                                                _t.id !=
                                                                EditorState.currentSceneId
                                                                    ? {
                                                                          bg: "gray.200",
                                                                      }
                                                                    : {}
                                                            }
                                                            onClick={() => {
                                                                EditorState.setCurrentSceneId(
                                                                    Number(
                                                                        _t.id
                                                                    )
                                                                );
                                                                currentScene?.scene.start(
                                                                    "Game",
                                                                    {
                                                                        id: _i,
                                                                    }
                                                                );
                                                            }}
                                                            onContextMenu={(
                                                                e
                                                            ) => {
                                                                setSceneListMenuPosition(
                                                                    {
                                                                        x: e.clientX,
                                                                        y: e.clientY,
                                                                    }
                                                                );
                                                                setSceneListMenuShow(
                                                                    true
                                                                );
                                                            }}
                                                        >
                                                            {_t.name}
                                                        </Tab>
                                                    )
                                                )}
                                            </Stack>
                                        </TabList>
                                    </Tabs>
                                    <MenuList
                                        position={"absolute"}
                                        top={sceneListMenuPosition.y}
                                        left={sceneListMenuPosition.x}
                                    >
                                        <MenuItem>Properties...</MenuItem>
                                    </MenuList>
                                </Menu>
                            </AccordionPanel>
                        </AccordionItem>
                        {/* Objects list */}
                        <AccordionItem id="objectsList">
                            <AccordionButton>
                                <Box as="span" textAlign="left" flex={1}>
                                    Layers
                                </Box>
                                <AddIcon
                                    boxSize={3}
                                    marginRight={1}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (EditorState.currentSceneId != null)
                                            SceneManager.createLayer(
                                                EditorState.currentSceneId,
                                                undefined,
                                                () => {
                                                    currentScene?.scene.start(
                                                        "Game",
                                                        {
                                                            id: EditorState.currentSceneId,
                                                        }
                                                    );
                                                }
                                            );
                                    }}
                                ></AddIcon>
                                <AccordionIcon marginLeft={1} />
                            </AccordionButton>
                            <AccordionPanel>
                                <Tabs
                                    variant="soft-rounded"
                                    colorScheme="green"
                                    isManual
                                    overflow={"auto"}
                                    maxHeight={"20vh"}
                                >
                                    <TabList>
                                        <Stack width="100%" spacing={0}>
                                            {/* TODO */}
                                            {SceneManager.layersInfo.map(
                                                (_t, _i) => (
                                                    <Tab
                                                        key={_i}
                                                        tabIndex={Number(_t.id)}
                                                        height={8}
                                                        justifyContent={"left"}
                                                        borderRadius="md"
                                                        cursor="default"
                                                        _hover={
                                                            _t.id !=
                                                            EditorState.currentLayerId
                                                                ? {
                                                                      bg: "gray.200",
                                                                  }
                                                                : {}
                                                        }
                                                        onClick={() => {
                                                            EditorState.setCurrentLayerId(
                                                                _t.id
                                                            );
                                                        }}
                                                    >
                                                        {_t.name}
                                                    </Tab>
                                                )
                                            )}
                                        </Stack>
                                    </TabList>
                                </Tabs>
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                </div>
                <div
                    id="rightContent"
                    className="absolute right-0 text-right flex z-[1] bg-white bg-opacity-85 "
                    onMouseEnter={() => {
                        EditorState.currentFocus.current =
                            EditorState.widgetName.RIGHT_CONTENT;
                    }}
                >
                    <div className="">
                        <TilePalette onSelectTiles={handleSelectTiles} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
