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
            <CommonList
                array={SceneManager.scenesInfo}
                itemIndex={sceneListItem}
                index={EditorState.currentSceneId}
                onTabClick={(_e, _t, _i) => {
                    EditorState.setCurrentSceneId(Number(_t.id));
                    phaserRef.current?.game?.scale.setGameSize(
                        SceneManager.scenesInfo[_i].width * 32,
                        SceneManager.scenesInfo[_i].height * 32
                    );
                    currentScene?.scene.start("Game", { id: _i }); // TODO: _i or _t.id
                }}
            >
                <MenuItem onClick={onScenePropertiesModalOpen}>
                    Properties...
                </MenuItem>
            </CommonList>
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
