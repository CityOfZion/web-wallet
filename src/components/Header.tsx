import * as React from "react";
import {Box, Flex, Image, Link, Text} from '@chakra-ui/react'
import {useWalletConnect} from "../context/WalletConnectContext";
import LogoutIcon from "./icon/LogoutIcon";
import {FileHelper} from "../helpers/FileHelper";
import {useAccountContext} from "../context/AccountContext";

const chainMeta = {
    name: 'Neo3',
    logo: 'https://cryptologos.cc/logos/neo-neo-logo.svg',
}

export default function Header(): any {
    const walletConnectCtx = useWalletConnect()
    const accountCtx = useAccountContext()

    const logout = async () => {
        accountCtx.setAccountPassword(undefined)
        accountCtx.setAccountDecripted(false)
        await walletConnectCtx.resetApp()
    }

    const ellipseAddress = (address = "", width = 10) => {
        return `${address.slice(0, width)}...${address.slice(-width)}`;
    }

    const exportAccount = async () => {
        const json = accountCtx.account?.export()
        FileHelper.downloadJsonFile(accountCtx.account?.address ?? '', json)
    }

    const isLoggedIn = () => {
        return accountCtx.account && accountCtx.accountDecripted
    }

    return (
        <Flex align="center" bgColor="#00000033" borderBottom="1px" borderColor="#ffffff33" h={["3.5rem", "6rem"]} px={["1rem", "3rem"]}>
            <Flex direction="column" flex={1} align={'start'}>
                <Text fontSize="2.25rem" fontWeight="bold">Web Wallet</Text>
                <Text fontSize="0.875rem" color="#888888" textTransform="uppercase" mt="-0.5rem">For Tests</Text>
            </Flex>
            <Box flex={1} borderWidth={1} p={'0.5rem'} borderColor={'#ffcc0066'} bg={'#ffcc0011'} mr={'1rem'}>
                ⚠ Warning: To stay compatible with the Wallets, all Dapps will need to upgrade. Read the{' '}
                <Link
                  href={'https://github.com/CityOfZion/wallet-connect-sdk/blob/develop/MIGRATION.md'}
                  target={'_blank'}
                  color={'#0099ff'}
                >
                    Migration Document
                </Link>{' '}
                to understand how and more important <b>when</b> to do it.
            </Box>
            {isLoggedIn() && (
                <Flex direction="column" align="right">
                    {accountCtx.account &&
                        <Flex
                            key={accountCtx.account.address}
                            align="center"
                        >
                            <Image src={chainMeta.logo} alt={chainMeta.name} title={chainMeta.name} w="1.6rem"
                                   mr="0.5rem"/>
                            <Flex direction="column">
                                <Text fontSize="0.875rem">{ellipseAddress(accountCtx.account.address, 8)}</Text>
                                <Link fontSize="0.875rem" mt="-0.3rem" color="#888888" onClick={exportAccount}>
                                    Download JSON File
                                </Link>
                            </Flex>
                            <Link ml="0.6rem" onClick={logout}>
                                <LogoutIcon boxSize="1.4rem" color="#888888"/>
                            </Link>
                        </Flex>}
                </Flex>
            )}
        </Flex>
    );
}
