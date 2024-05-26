import { FC, useRef, useState } from "react";
import {
    Stack,
    Tabs,
    TabList,
    Tab,
    Menu,
    MenuList,
    MenuItem,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    FormControl,
    FormLabel,
    Input,
    Button,
    NumberInput,
    NumberInputField,
    useDisclosure,
} from "@chakra-ui/react";
import { Formik, Field, FieldProps } from "formik";
import { SceneManager } from "../../managers/SceneManager";
import { EditorState } from "../../EditorState";
import { IRefPhaserGame } from "../../game/PhaserGame";

interface ScenesListProps {
    phaserRef: React.MutableRefObject<IRefPhaserGame | null>;
    currentScene: Phaser.Scene | undefined;
}

const SceneList: FC<ScenesListProps> = ({ phaserRef, currentScene }) => {
    // Scene list menu switch
    const [sceneListMenuShow, setSceneListMenuShow] = useState<boolean>(false);

    // Scene list focus
    const [sceneListFocus, setSceneListFocus] = useState<boolean>(false);

    // Scene list menu position
    const [sceneListMenuPosition, setSceneListMenuPosition] = useState({
        x: 0,
        y: 0,
    });

    // Current scene list item
    const sceneListItem = useRef<number>(0);

    // Scene properties modal
    const {
        isOpen: isScenePropertiesModalOpen,
        onOpen: onScenePropertiesModalOpen,
        onClose: onScenePropertiesModalClose,
    } = useDisclosure();

    // Editing scene properties
    const [scenePropertiesEditing, setScenePropertiesEditing] =
        useState<boolean>(false);

    // Edit the properties of the scene
    const editSceneProperties = (values: {
        sceneName: string;
        gridWidth: number;
        gridHeight: number;
    }) => {
        setScenePropertiesEditing(true);
        const sceneInfo = SceneManager.scenesInfo[sceneListItem.current];
        if (sceneInfo.name !== values.sceneName) {
            SceneManager.renameScene(
                sceneListItem.current,
                values.sceneName,
                () => {
                    if (
                        !sceneInfo?.width ||
                        !sceneInfo?.height ||
                        (sceneInfo.width === values.gridWidth &&
                            sceneInfo.height === values.gridHeight)
                    ) {
                        setScenePropertiesEditing(false);
                        return;
                    } else {
                        SceneManager.resizeScene(
                            sceneListItem.current,
                            values.gridWidth,
                            values.gridHeight,
                            () => {
                                if (
                                    phaserRef.current?.game &&
                                    EditorState.currentSceneId ===
                                        sceneListItem.current
                                ) {
                                    phaserRef.current.game.scale.setGameSize(
                                        values.gridWidth * 32,
                                        values.gridHeight * 32
                                    );
                                    currentScene?.scene.start("Game", {
                                        id: EditorState.currentSceneId,
                                    });
                                    setScenePropertiesEditing(false);
                                }
                            }
                        );
                    }
                }
            );
        } else {
            if (
                !sceneInfo?.width ||
                !sceneInfo?.height ||
                (sceneInfo.width === values.gridWidth &&
                    sceneInfo.height === values.gridHeight)
            ) {
                setScenePropertiesEditing(false);
                return;
            } else {
                SceneManager.resizeScene(
                    sceneListItem.current,
                    values.gridWidth,
                    values.gridHeight,
                    () => {
                        if (
                            phaserRef.current?.game &&
                            EditorState.currentSceneId === sceneListItem.current
                        ) {
                            phaserRef.current.game.scale.setGameSize(
                                values.gridWidth * 32,
                                values.gridHeight * 32
                            );
                            currentScene?.scene.start("Game", {
                                id: EditorState.currentSceneId,
                            });
                            setScenePropertiesEditing(false);
                        }
                    }
                );
            }
        }
    };

    return (
        <div>
            <Menu
                isLazy
                isOpen={sceneListMenuShow}
                closeOnBlur={!sceneListFocus}
                onClose={() => {
                    setSceneListMenuShow(false);
                }}
            >
                <Tabs
                    defaultIndex={EditorState.currentSceneId} // TODO
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
                            {SceneManager.scenesInfo.map((_t, _i) => (
                                <Tab
                                    key={_i}
                                    tabIndex={Number(_t.id)}
                                    height={8}
                                    justifyContent={"left"}
                                    borderRadius="md"
                                    cursor="default"
                                    _hover={
                                        _t.id != EditorState.currentSceneId
                                            ? {
                                                  bg: "gray.200",
                                              }
                                            : {}
                                    }
                                    onClick={() => {
                                        EditorState.setCurrentSceneId(
                                            Number(_t.id)
                                        );
                                        phaserRef.current?.game?.scale.setGameSize(
                                            SceneManager.scenesInfo[_i].width *
                                                32,
                                            SceneManager.scenesInfo[_i].height *
                                                32
                                        );
                                        currentScene?.scene.start("Game", {
                                            id: _i,
                                        });
                                    }}
                                    onContextMenu={(e) => {
                                        setSceneListMenuPosition({
                                            x: e.clientX,
                                            y: e.clientY,
                                        });
                                        setSceneListMenuShow(true);
                                        sceneListItem.current = _i;
                                    }}
                                >
                                    {_t.name}
                                </Tab>
                            ))}
                        </Stack>
                    </TabList>
                </Tabs>
                <MenuList
                    position={"absolute"}
                    top={sceneListMenuPosition.y}
                    left={sceneListMenuPosition.x}
                >
                    <MenuItem onClick={onScenePropertiesModalOpen}>
                        Properties...
                    </MenuItem>
                </MenuList>
            </Menu>
            <Modal
                isOpen={isScenePropertiesModalOpen}
                onClose={onScenePropertiesModalClose}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Edit scene properties</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Formik
                            initialValues={{
                                sceneName:
                                    SceneManager.scenesInfo[
                                        sceneListItem.current
                                    ]?.name,
                                gridWidth:
                                    SceneManager.scenesInfo[
                                        sceneListItem.current
                                    ]?.width,
                                gridHeight:
                                    SceneManager.scenesInfo[
                                        sceneListItem.current
                                    ]?.height,
                            }}
                            onSubmit={editSceneProperties}
                        >
                            {({ handleSubmit }) => (
                                <form onSubmit={handleSubmit}>
                                    <Stack spacing={4}>
                                        <FormControl>
                                            <FormLabel>Scene name</FormLabel>
                                            <Field
                                                as={Input}
                                                name="sceneName"
                                            />
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>Grids' width</FormLabel>
                                            <Field name="gridWidth">
                                                {({
                                                    form,
                                                    field,
                                                }: FieldProps) => (
                                                    <NumberInput
                                                        {...field}
                                                        max={200}
                                                        min={1}
                                                        step={1}
                                                        allowMouseWheel
                                                        onChange={(value) =>
                                                            form.setFieldValue(
                                                                field.name,
                                                                value
                                                            )
                                                        }
                                                    >
                                                        <NumberInputField />
                                                    </NumberInput>
                                                )}
                                            </Field>
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel>Grids' Height</FormLabel>
                                            <Field name="gridHeight">
                                                {({
                                                    form,
                                                    field,
                                                }: FieldProps) => (
                                                    <NumberInput
                                                        {...field}
                                                        max={200}
                                                        min={1}
                                                        step={1}
                                                        allowMouseWheel
                                                        onChange={(value) =>
                                                            form.setFieldValue(
                                                                field.name,
                                                                value
                                                            )
                                                        }
                                                    >
                                                        <NumberInputField />
                                                    </NumberInput>
                                                )}
                                            </Field>
                                        </FormControl>
                                        <Button
                                            type="submit"
                                            colorScheme="green"
                                            isLoading={scenePropertiesEditing}
                                            onClick={() => {
                                                setTimeout(() => {
                                                    if (!scenePropertiesEditing)
                                                        onScenePropertiesModalClose();
                                                }, 60);
                                            }}
                                        >
                                            {"Save"}
                                        </Button>
                                    </Stack>
                                </form>
                            )}
                        </Formik>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default SceneList;
