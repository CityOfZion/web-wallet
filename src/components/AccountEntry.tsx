import * as React from "react";
import {Box, Button, DividerProps, Flex, Image, Input, Spacer, Spinner, Text, useToast} from "@chakra-ui/react";
import {useWalletConnect} from "../context/WalletConnectContext";
import {FileHelper} from "../helpers/FileHelper";
import {wallet} from "@cityofzion/neon-js";
import {useCallback, useEffect, useState} from "react";
import KeyValueStorage from "keyvaluestorage";
import {Account, AccountJSON} from "@cityofzion/neon-core/lib/wallet/Account";
import {useAccountContext} from "../context/AccountContext";
import {DEFAULT_CHAIN_ID} from "../constants";

export default function AccountEntry(props: DividerProps): any {
    const walletConnectCtx = useWalletConnect()
    const accountCtx = useAccountContext()
    const toast = useToast()
    const [choseNetwork, setChoseNetwork] = useState(false)
    const [creatingNew, setCreatingNew] = useState(false)
    const [loading, setLoading] = useState(false)

    const setAccount = (acc: Account) => {
        accountCtx.setAccount(acc);
        walletConnectCtx.addAccountAndChain(acc.address, DEFAULT_CHAIN_ID)
    }

    const loadAccountFromStorage = useCallback(async (storage: KeyValueStorage) => {
        if (!accountCtx.account) {
            const json = await storage.getItem<Partial<AccountJSON>>("account")
            if (json) {
                const account = new wallet.Account(json)
                setAccount(account)
            }
        }
    }, [accountCtx])

    useEffect(() => {
        if (walletConnectCtx.storage) {
            loadAccountFromStorage(walletConnectCtx.storage)
        }
    }, [loadAccountFromStorage, walletConnectCtx.storage])

    const login = async (e: React.SyntheticEvent) => {
        e.preventDefault()
        setLoading(true)
        await passwordOnAccount()
        setLoading(false)
    }

    const passwordOnAccount = async () => {
        if (accountCtx.account && accountCtx.accountPassword && walletConnectCtx.storage) {
            if (!creatingNew) {
                try {
                    await accountCtx.account.decrypt(accountCtx.accountPassword)
                } catch (e) {
                    toast({
                        title: e.message,
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                    })
                    return
                }
            }
            accountCtx.setAccountDecripted(true)

            try {
                await accountCtx.account.encrypt(accountCtx.accountPassword)
            } catch (e) {
                console.log("error encrypting account")
            }
            await walletConnectCtx.storage.setItem("account", accountCtx.account.export())
        }
    }

    const importAccount = async () => {
        const file = await FileHelper.promptForSingleFile("json")
        const json = await file?.text()
        if (json) {
            const acc = JSON.parse(json)
            const account = new wallet.Account(acc)
            setAccount(account)
            setCreatingNew(false)
        }
    }

    const createAccount = async () => {
        const account = new wallet.Account()
        setAccount(account)
        setCreatingNew(true)
    }

    return (
        <Flex direction="column" align="center" {...props}>
            <Spacer/>
            {loading ? <Spinner alignSelf="center" />
            : !choseNetwork ? <>
                <Text fontSize="0.875rem" color="#888888">Choose your network?</Text>
                <Text fontSize="0.75rem" mt="1.5rem" w="20rem">RPC Address</Text>
                <Input onChange={(e: any) => accountCtx.setRpcAddress(e.target.value)}
                       value={accountCtx.rpcAddress}
                       borderColor="#373d4a" borderRadius={0} bg="#1a202b"
                       _placeholder={{color: '#373d4a'}} mt="0.5rem" w="20rem"
                />
                <Text fontSize="0.75rem" mt="1.5rem" w="20rem">Magic Number</Text>
                <Input onChange={(e: any) => accountCtx.setNetworkMagic(e.target.value)}
                       value={accountCtx.networkMagic}
                       borderColor="#373d4a" borderRadius={0} bg="#1a202b"
                       _placeholder={{color: '#373d4a'}} mt="0.5rem" w="20rem"
                />
                <Button onClick={() => setChoseNetwork(true)} h="2.75rem" mt="1.5rem" bg="#373d4a" borderRadius={0} _hover={{bg: 'black'}}>
                    Continue</Button>
            </>
            : !accountCtx.account ? <>
                <Text fontSize="0.875rem" color="#888888">Do you have an Account JSON File?</Text>
                <Flex h="2.75rem" mt="1.5rem">
                    <Button onClick={importAccount} h="100%" bg="#373d4a" borderRadius={0} _hover={{bg: 'black'}}>
                        Yes! Import File</Button>
                    <Button onClick={createAccount} h="100%" bg="#373d4a" borderRadius={0} _hover={{bg: 'black'}}
                            ml="0.5rem">
                        No, Generate a new one</Button>
                </Flex>
            </> : <Flex>
                    <Flex as="form" onSubmit={login} direction="column" align="center">
                        <Text fontSize="0.875rem" color="#888888" fontWeight="bold">{
                            !creatingNew ? `Login with this Account` : `Create Account`
                        }</Text>
                        <Flex align="center" mt="0.8rem">
                            <Image w="1.875rem" src="https://cryptologos.cc/logos/neo-neo-logo.svg"/>
                            <Text fontSize="0.875rem" ml="0.5rem">{accountCtx.account.address}</Text>
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
                </Flex>}
            <Spacer/>
        </Flex>
    );
}
