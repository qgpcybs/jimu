import { FC, useRef, useState } from "react";
import {
    Stack,
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
import CommonList from "../common/CommonList";

interface ScenesListProps {
    phaserRef: React.MutableRefObject<IRefPhaserGame | null>;
    currentScene: Phaser.Scene | undefined;
}

const SceneList: FC<ScenesListProps> = ({ phaserRef, currentScene }) => {
    // Current scene list item
    const itemIndex = useRef<number>(0);

    // Scene properties modal
    const {
        isOpen: isScenePropertiesModalOpen,
        onOpen: onScenePropertiesModalOpen,
        onClose: onScenePropertiesModalClose,
    } = useDisclosure();

    // Scene delete tips model
    const {
        isOpen: isSceneDeleteModalOpen,
        onOpen: onSceneDeleteModalOpen,
        onClose: onSceneDeleteModalClose,
    } = useDisclosure();

    // Editing scene properties
    const [scenePropertiesEditing, setScenePropertiesEditing] =
        useState<boolean>(false);

    // Edit the properties of the scene
    const editSceneProperties = (values: {
        sceneName: string;
        gridWidth: number;
        gridHeight: number;
        tileSize: number;
    }) => {
        setScenePropertiesEditing(true);
        const sceneInfo = SceneManager.scenesInfo[itemIndex.current];
        const sceneId = Number(sceneInfo.id);

        const afterRenameScene = () => {
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
                    sceneId,
                    values.gridWidth,
                    values.gridHeight,
                    () => {
                        if (
                            phaserRef.current?.game &&
                            EditorState.currentSceneId === sceneInfo.id
                        ) {
                            phaserRef.current.game.scale.setGameSize(
                                values.gridWidth * 32,
                                values.gridHeight * 32
                            );
                            currentScene?.scene.start("Game", {
                                id: EditorState.currentSceneId,
                            });
                        }
                        setScenePropertiesEditing(false);
                    }
                );
            }
        };

        // When the scene name changed
        if (sceneInfo.name !== values.sceneName)
            SceneManager.renameScene(
                sceneId,
                values.sceneName,
                afterRenameScene
            );
        else afterRenameScene();
    };

    return (
        <div>
            <CommonList
                array={SceneManager.scenesInfo}
                itemIndex={itemIndex}
                id={EditorState.currentSceneId}
                onTabClick={(_e, _t, _i) => {
                    EditorState.setCurrentSceneId(Number(_t.id));
                    phaserRef.current?.game?.scale.setGameSize(
                        SceneManager.scenesInfo[_i].width * 32,
                        SceneManager.scenesInfo[_i].height * 32
                    );
                    currentScene?.scene.start("Game", { id: _t.id });
                }}
            >
                <MenuItem onClick={onScenePropertiesModalOpen}>
                    Properties...
                </MenuItem>
                <MenuItem onClick={onSceneDeleteModalOpen} color={"red"}>
                    Delete
                </MenuItem>
            </CommonList>
            <Modal
                isOpen={isSceneDeleteModalOpen}
                onClose={onSceneDeleteModalClose}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        Are you sure to delete the scene "
                        {SceneManager.scenesInfo[itemIndex.current]?.name}"?
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Button
                            type="submit"
                            colorScheme="green"
                            isLoading={scenePropertiesEditing}
                            onClick={() => {
                                if (SceneManager.scenesInfo.length <= 1) {
                                    alert(
                                        "Sorry, you need to keep at least one scene in the editor."
                                    );
                                    return;
                                }
                                setScenePropertiesEditing(true); // Start
                                const sceneId = Number(
                                    SceneManager.scenesInfo[itemIndex.current]
                                        ?.id
                                );
                                SceneManager.deleteScene(sceneId, () => {
                                    if (
                                        EditorState.currentSceneId === sceneId
                                    ) {
                                        phaserRef.current?.game?.scale.setGameSize(
                                            SceneManager.scenesInfo[
                                                itemIndex.current
                                            ].width * 32,
                                            SceneManager.scenesInfo[
                                                itemIndex.current
                                            ].height * 32
                                        );
                                        itemIndex.current = Number(
                                            SceneManager.scenesInfo[0].id
                                        );
                                        currentScene?.scene.start("Game", {
                                            id: SceneManager.scenesInfo[0].id,
                                        });
                                    }
                                    setScenePropertiesEditing(false); // End
                                    onSceneDeleteModalClose();
                                });
                            }}
                        >
                            {"Delete"}
                        </Button>
                    </ModalBody>
                </ModalContent>
            </Modal>
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
                                    SceneManager.scenesInfo[itemIndex.current]
                                        ?.name,
                                gridWidth:
                                    SceneManager.scenesInfo[itemIndex.current]
                                        ?.width,
                                gridHeight:
                                    SceneManager.scenesInfo[itemIndex.current]
                                        ?.height,
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
