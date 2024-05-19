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
    Button,
    IconButton,
    NumberInput,
    NumberInputField,
    Divider,
} from "@chakra-ui/react";
import { PiNotePencil } from "react-icons/pi";

const Toolset = () => {
    return (
        <div className="flex justify-between h-16 px-4 pt-2 bg-white z-[1] relative opacity-85">
            <IconButton
                aria-label="Paint a tile"
                size="lg"
                icon={<PiNotePencil />}
            />
            <Divider orientation="vertical" />
            222
        </div>
    );
};

export default Toolset;
