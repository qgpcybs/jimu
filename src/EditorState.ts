export class EditorState {
    /**
     * Current scene ID
     */
    static currentSceneId: number;

    /**
     * [Set] Current scene ID
     */
    static setCurrentSceneId: React.Dispatch<
        React.SetStateAction<number>
    >;

    /**
     * Current layer ID
     */
    static currentLayerId: number;

    /**
     * [Set] Current layer ID
     */
    static setCurrentLayerId: React.Dispatch<React.SetStateAction<number>>;
}
