import * as React from "react";
import {Box, Button, DividerProps, Flex, Image, Input, Spacer, Text} from "@chakra-ui/react";
import {useWalletConnect} from "../context/WalletConnectContext";
import {FileHelper} from "../helpers/FileHelper";
import {wallet} from "@cityofzion/neon-js";
import {useCallback, useEffect, useState} from "react";
import KeyValueStorage from "keyvaluestorage";
import {AccountJSON} from "@cityofzion/neon-core/lib/wallet/Account";
import {useAccountContext} from "../context/AccountContext";

export default function AccountEntry(props: DividerProps) {
    const walletConnectCtx = useWalletConnect()
    const accountCtx = useAccountContext()
    const [creatingNew, setCreatingNew] = useState(false)

    const loadAccountFromStorage = useCallback(async (storage: KeyValueStorage) => {
        const json = await storage.getItem<Partial<AccountJSON>>("account")
        if (json) {
            const account = new wallet.Account(json)
            walletConnectCtx.setAccounts([account])
        }
    }, [walletConnectCtx])

    useEffect(() => {
        if (walletConnectCtx.storage) {
            loadAccountFromStorage(walletConnectCtx.storage)
        }
    }, [loadAccountFromStorage, walletConnectCtx.storage])

    const login = async (e: React.SyntheticEvent) => {
        e.preventDefault()
        await passwordOnAccount()
        await walletConnectCtx.initClient()
    }

    const passwordOnAccount = async () => {
        if (walletConnectCtx.accounts.length && accountCtx.accountPassword && walletConnectCtx.storage) {
            const acc = walletConnectCtx.accounts[0]
            await acc.decrypt(accountCtx.accountPassword)
            walletConnectCtx.setAccounts([acc])
            accountCtx.setAccountDecripted(true)

            try {
                await acc.encrypt(accountCtx.accountPassword)
            } catch (e) {
            }
            await walletConnectCtx.storage.setItem("account", acc.export())
        }
    }

    const importAccount = async () => {
        const file = await FileHelper.promptForSingleFile("json")
        const json = await file?.text()
        if (json) {
            const acc = JSON.parse(json)
            const account = new wallet.Account(acc)
            walletConnectCtx.setAccounts([account])
            setCreatingNew(false)
        }
    }

    const createAccount = async () => {
        const account = new wallet.Account()
        walletConnectCtx.setAccounts([account])
        setCreatingNew(true)
    }

    return (
        <Flex direction="column" align="center" {...props}>
            <Spacer/>
            {!walletConnectCtx.accounts.length ? (<>
                <Text fontSize="0.875rem" color="#888888">Do you have an Account JSON File?</Text>
                <Flex h="2.75rem" mt="1.5rem">
                    <Button onClick={importAccount} h="100%" bg="#373d4a" borderRadius={0} _hover={{bg: 'black'}}>
                        Yes! Import File</Button>
                    <Button onClick={createAccount} h="100%" bg="#373d4a" borderRadius={0} _hover={{bg: 'black'}}
                            ml="0.5rem">
                        No, Generate a new one</Button>
                </Flex>
            </>) : (<>
                <Flex>
                    <Flex as="form" onSubmit={login} direction="column" align="center">
                        <Text fontSize="0.875rem" color="#888888" fontWeight="bold">{
                            !creatingNew ? `Login with this Account` : `Create Account`
                        }</Text>
                        <Flex align="center" mt="0.8rem">
                            <Image w="1.875rem" src="https://cryptologos.cc/logos/neo-neo-logo.svg"/>
                            <Text fontSize="0.875rem" ml="0.5rem">{walletConnectCtx.accounts[0].address}</Text>
                        </Flex>
                        <Input type={`password`} onChange={(e: any) => accountCtx.setAccountPassword(e.target.value)}
                               borderColor="#373d4a" borderRadius={0} bg="#1a202b"
                               _placeholder={{color: '#373d4a'}} mt="1rem"
                               placeholder={!creatingNew ? `Type your password` : `Type a new password`}
                        />
                        <Button type="submit" w="6.5rem" h="2.75rem" bg="#373d4a" borderRadius={0} mt="1rem"
                                _hover={{bg: 'black'}}>{
                            !creatingNew ? `Login` : `Create`
                        }</Button>
                    </Flex>
                    <Flex direction="column" align="center" ml="2rem">
                        <Box flex={1} w="1px" bg="#888888" />
                        <Text fontSize="0.875rem" color="#888888" my="0.5rem">Or</Text>
                        <Box flex={1} w="1px" bg="#888888" />
                    </Flex>
                    <Flex direction="column" w="12rem" alignSelf="center" ml="2rem">
                        <Button onClick={importAccount} w="100%" h="2.75rem" bg="#373d4a" borderRadius={0}
                                _hover={{bg: 'black'}}>{
                            !creatingNew ? `Import another Account` : `Import an Account`
                        }</Button>
                        {!creatingNew &&
                            <Button onClick={createAccount} w="100%" h="2.75rem" bg="#373d4a" borderRadius={0}
                                    _hover={{bg: 'black'}} mt="0.5rem">
                                Generate a new Account
                            </Button>
                        }
                    </Flex>
                </Flex>
            </>)}
            <Spacer/>
        </Flex>
    );
}
