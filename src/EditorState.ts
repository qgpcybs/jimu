export class EditorState {
    /**
     * Current layer ID
     */
    static currentLayerId: number | undefined;

    /**
     * [Set] Current layer ID
     */
    static setCurrentLayerId: React.Dispatch<
        React.SetStateAction<number | undefined>
    >;
}
