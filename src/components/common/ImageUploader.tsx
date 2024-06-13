import { useState } from "react";
import { HStack, Button, Input, Flex } from "@chakra-ui/react";
import { AssetManager } from "../../managers/AssetManager";

export const ImageUploader = () => {
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
        <HStack width="100%">
            <Button
                as="label"
                htmlFor="file-input"
                cursor="pointer"
                variant="outline"
                colorScheme="green"
                className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis"
            >
                {image ? image.name : "Choose File"}
            </Button>
            <Input
                id="file-input"
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                style={{ display: "none" }}
            />
            <Button onClick={handleFileUpload} colorScheme="green">
                {"Confirm"}
            </Button>
        </HStack>
    );
};

export default ImageUploader;
