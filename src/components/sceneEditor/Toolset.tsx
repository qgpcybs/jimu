import { FC, useState, useRef } from "react";
import { Formik, Field } from "formik";
import Tile from "./Tile";
import FileInput from "../common/FileInput";
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
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    FormControl,
    FormLabel,
    Input,
    useDisclosure,
    ButtonGroup,
    Button,
    IconButton,
    NumberInput,
    NumberInputField,
    Divider,
} from "@chakra-ui/react";
import { PiNotePencil } from "react-icons/pi";
import { LuPaintBucket } from "react-icons/lu";

const Toolset = () => {
    // Paint pencil (paint one tile)
    const onPaintPencilClick = () => {

    };
    
    // Paint bucket (paint a connected area)
    const onPaintBucketClick = () => {

    };

    // Rendering
    return (
        <div className="flex justify-between h-16 px-4 pt-2 bg-white z-[1] relative opacity-85">
            <Tabs variant="unstyled">
                <TabList>
                    <Tab _selected={{ color: "white", bg: "green.500" }}>
                        <IconButton
                            variant="none"
                            aria-label="Paint a tile"
                            fontSize={24}
                            icon={<PiNotePencil />}
                            onClick={onPaintPencilClick}
                        />
                    </Tab>
                    <Tab _selected={{ color: "white", bg: "green.500" }}>
                        <IconButton
                            variant="none"
                            aria-label="Paint all tiles"
                            fontSize={24}
                            icon={<LuPaintBucket />}
                            onClick={onPaintBucketClick}
                        />
                    </Tab>
                </TabList>
            </Tabs>
            <Divider orientation="vertical" />
        </div>
    );
};

export default Toolset;
