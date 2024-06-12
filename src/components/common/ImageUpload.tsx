import { useState } from "react";
import { Box, Button, Input } from "@chakra-ui/react";
import { AssetManager } from "../../managers/AssetManager";

export const ImageUpload = () => {
    // Image object
    const [image, setImage] = useState<File | null>();

    // Set the content of file to image object
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        files && files[0] && setImage(files[0]);
    };

    // Upload the file content to AssetManager
    const handleFileUpload = async () => {
        if (!image) return;
        const fileReader = new FileReader();
        fileReader.onload = async (event) => {
            const result = event.target?.result;
            if (result)
                await AssetManager.importAsset(
                    image.name,
                    result,
                    AssetManager.subType.TILESET
                );
        };
        fileReader.readAsDataURL(image);
    };

    return (
        <Box>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
            <Button onClick={handleFileUpload} colorScheme="green">
                {"Confirm"}
            </Button>
        </Box>
    );
};

export default ImageUpload;
