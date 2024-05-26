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
    useDisclosure,
    Button,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import Draggable from "react-draggable";
import { SceneInfo, LayerInfo } from "./api/Scenes";
import { EditorState } from "./EditorState";
import { SceneManager } from "./managers/SceneManager";
import { DatabaseManager } from "./managers/DatabaseManger";
import Toolset from "./components/sceneEditor/Toolset";
import { SceneDatabase } from "./api/Scenes";
import SceneList from "./components/sceneEditor/ScenesList";

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
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = useRef();
    const [uploadLayerToDatabaseResult, setUploadLayerToDatabaseResult] =
        useState<string>("");
    const uploadLayerToDatabase = () => {
        // get the this.sceneId dynamically.
        SceneManager.loadScene(
            EditorState.currentSceneId,
            async (database: SceneDatabase) => {
                if (database.objects.length > 0) {
                    const layer = database.objects[0]; // Assuming you want the first object
                    const payload = {
                        name: layer.name,
                        // TODO: Add all params as input.
                        depth: layer.depth,
                        type: layer.type,
                        id: layer.id,
                        subType: layer.subType,

                        description: "", // Example description

                        map: layer.data, // Converting array data to string if necessary
                        uri: "", // Placeholder URI
                        creator: "0x01", // Placeholder creator ID
                    };

                    try {
                        const response = await fetch(
                            "https://map-manager.deno.dev/create",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: "Bearer yourTokenHere", // if auth is needed
                                },
                                body: JSON.stringify(payload),
                            }
                        );

                        const responseData = await response.json();
                        // TODO: pop-up a message to the user with the response data.
                        if (response.ok) {
                            setUploadLayerToDatabaseResult(
                                `Upload successful:${JSON.stringify(
                                    responseData
                                )}`
                            );
                            onOpen();
                            console.log("Upload successful:", responseData);
                        } else {
                            setUploadLayerToDatabaseResult(
                                `Failed to upload: ${responseData.error}`
                            );
                            onOpen();
                            throw new Error(
                                `Failed to upload: ${responseData.error}`
                            );
                        }
                    } catch (error) {
                        console.error(
                            "Error uploading layer to database:",
                            error
                        );
                    }
                } else {
                    console.log("No objects available in the scene to upload.");
                }
            }
        );
    };
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
                    phaserRef.current?.game?.scale.setGameSize(
                        SceneManager.scenesInfo[EditorState.currentSceneId]
                            .width * 32,
                        SceneManager.scenesInfo[EditorState.currentSceneId]
                            .height * 32
                    );
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
                className="flex flex-row justify-between w-screen bg-white h-[calc(100vh-3rem)]"
            >
                <div
                    id="renderingContent"
                    className="absolute z-0 pl-48 max-w-[100vw]"
                >
                    {/* Phaser rendering area */}
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
                    id="leftContent"
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
                                <SceneList
                                    phaserRef={phaserRef}
                                    currentScene={currentScene}
                                />
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
                    <button
                        onClick={uploadLayerToDatabase}
                        className="upload-btn"
                    >
                        Upload this Scene <br></br>
                        to Online Databse
                    </button>
                    <br></br>
                    <button className="upload-btn">Map-Aptos-Uploader</button>
                </div>
                <div
                    id="middleContent"
                    className="flex-grow"
                    onMouseEnter={() => {
                        EditorState.currentFocus.current =
                            EditorState.widgetName.MIDDLE_CONTENT;
                    }}
                >
                    {/* Editing tilemap */}
                    <Toolset />
                </div>
                <div
                    id="rightContent"
                    className="right-0 text-right flex z-[1] bg-white bg-opacity-85 h-full"
                    onMouseEnter={() => {
                        EditorState.currentFocus.current =
                            EditorState.widgetName.RIGHT_CONTENT;
                    }}
                >
                    <div id="inspector"></div>
                    <div id="tilePalette" className="pl-0.5">
                        <TilePalette onSelectTiles={handleSelectTiles} />
                    </div>
                </div>
            </div>
            <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={onClose}
                isCentered
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Upload Scene
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {uploadLayerToDatabaseResult}
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                close
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </div>
    );
}

export default App;
