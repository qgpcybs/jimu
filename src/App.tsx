import { useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import { MainMenu } from "./game/scenes/MainMenu";
import { Game } from "./game/scenes/Game";
import TilePalette from "./components/sceneEditor/TilePalette";
import { EventBus } from "./game/EventBus";
import { Button, ButtonGroup } from "@chakra-ui/react";
import { SceneManager } from "./managers/SceneManager";

function editorInit() {
    SceneManager.init();
}

function App() {
    // Init Jimu
    editorInit();

    // // The sprite can only be moved in the MainMenu Scene
    const [canMoveSprite, setCanMoveSprite] = useState(true);

    const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    // Event emitted from the PhaserGame component
    const currentScene = (scene: Phaser.Scene) => {
        // setCanMoveSprite(scene.scene.key !== "MainMenu");
    };

    const changeScene = () => {
        if (phaserRef.current) {
            const scene = phaserRef.current.scene as Game;

            if (scene) {
                scene.changeScene();
            }
        }
    };

    const moveSprite = () => {
        if (phaserRef.current) {
            const scene = phaserRef.current.scene as MainMenu;

            if (scene && scene.scene.key === "MainMenu") {
                // Get the update logo position
                scene.moveLogo(({ x, y }) => {
                    setSpritePosition({ x, y });
                });
            }
        }
    };

    const addSprite = () => {
        if (phaserRef.current) {
            const scene = phaserRef.current.scene;

            if (scene) {
                // Add more stars
                const x = Phaser.Math.Between(64, scene.scale.width - 64);
                const y = Phaser.Math.Between(64, scene.scale.height - 64);

                //  `add.sprite` is a Phaser GameObjectFactory method and it returns a Sprite Game Object instance
                const star = scene.add.sprite(x, y, "star");

                //  ... which you can then act upon. Here we create a Phaser Tween to fade the star sprite in and out.
                //  You could, of course, do this from within the Phaser Scene code, but this is just an example
                //  showing that Phaser objects and systems can be acted upon from outside of Phaser itself.
                scene.add.tween({
                    targets: star,
                    duration: 500 + Math.random() * 1000,
                    alpha: 0,
                    yoyo: true,
                    repeat: -1,
                });
            }
        }
    };
    const handleSelectTiles = (
        stX: number,
        stY: number,
        edX?: number,
        edY?: number
    ) => {
        EventBus.emit("paint-tiles", stX, stY, edX, edY);
    };

    return (
        <div id="app">
            <div className="topBar h-32"></div>
            <div className="flex flex-row">
                <div className="w-36 flex-col flex p-2">
                    <span>Scene</span>
                    <ButtonGroup className="flex-col space-x-0 space-y-2">
                        <Button
                            colorScheme="teal"
                            variant="outline"
                            onClick={() => {
                                SceneManager.createScene();
                            }}
                        >
                            Scene1
                        </Button>
                        <Button colorScheme="teal" variant="outline">
                            Scene2
                        </Button>
                    </ButtonGroup>
                </div>
                <div className="relative">
                    <div className="projectArea absolute -z-10">
                        <PhaserGame
                            ref={phaserRef}
                            currentActiveScene={currentScene}
                        />
                    </div>
                </div>
                <div className="mainContent flex">
                    <div className="absolute right-0 w-[32rem] h-[64rem]">
                        <TilePalette onSelectTiles={handleSelectTiles} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
