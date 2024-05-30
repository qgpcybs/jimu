import { FC, useState } from "react";
import { Stack, Tabs, TabList, Tab, Menu, MenuList } from "@chakra-ui/react";

interface CommonListProps {
    array: { id: number | IDBValidKey; name: string }[];
    index: number;
    itemIndex: React.MutableRefObject<number>;
    onTabClick: (
        _e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        _t: { id: number | IDBValidKey; name: string },
        _i: number
    ) => void | undefined;
    children: React.ReactNode;
}

const CommonList: FC<CommonListProps> = ({
    array,
    index,
    itemIndex,
    onTabClick,
    children,
}) => {
    // Focus
    const [focus, setFocus] = useState<boolean>(false);

    // Menu switch
    const [menuShow, setMenuShow] = useState<boolean>(false);

    // Menu position
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    return (
        <Menu
            isLazy
            isOpen={menuShow}
            closeOnBlur={!focus}
            onClose={() => {
                setMenuShow(false);
            }}
        >
            <Tabs
                defaultIndex={index}
                variant="soft-rounded"
                colorScheme="green"
                isManual
                overflow={"auto"}
                onMouseEnter={() => setFocus(true)}
                onMouseLeave={() => setFocus(false)}
            >
                <TabList>
                    <Stack width="100%" spacing={0}>
                        {array.map((_t, _i) => (
                            <Tab
                                key={_i}
                                tabIndex={Number()}
                                height={8}
                                justifyContent={"left"}
                                borderRadius={"md"}
                                cursor={"default"}
                                _hover={
                                    _t.id != index ? { bg: "gray.200" } : {}
                                }
                                onClick={(_e) => {
                                    if (onTabClick) onTabClick(_e, _t, _i);
                                }}
                                onContextMenu={(_e) => {
                                    setMenuPosition({
                                        x: _e.clientX,
                                        y: _e.clientY,
                                    });
                                    setMenuShow(true);
                                    itemIndex.current = _i;
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
                top={menuPosition.y}
                left={menuPosition.x}
            >
                {children}
            </MenuList>
        </Menu>
    );
};

export default CommonList;
