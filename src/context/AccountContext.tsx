import React, {useContext, useState} from "react";
import {DEFAULT_NEO_NETWORK_MAGIC, DEFAULT_NEO_RPC_ADDRESS} from "../constants";
import {Account} from "@cityofzion/neon-core/lib/wallet";

interface IAccountContext {
    accountPassword: string | undefined,
    setAccountPassword: React.Dispatch<React.SetStateAction<string | undefined>>,
    accountDecripted: boolean,
    setAccountDecripted: React.Dispatch<React.SetStateAction<boolean>>,
    rpcAddress: string,
    setRpcAddress: React.Dispatch<React.SetStateAction<string>>,
    networkMagic: number,
    setNetworkMagic: React.Dispatch<React.SetStateAction<number>>,
    account: Account | undefined,
    setAccount: React.Dispatch<React.SetStateAction<Account | undefined>>,
}

export const AccountContext = React.createContext({} as IAccountContext)

export const AccountContextProvider: React.FC = ({ children }) => {
    const [accountPassword, setAccountPassword] = useState<string | undefined>(undefined)
    const [accountDecripted, setAccountDecripted] = useState(false)
    const [rpcAddress, setRpcAddress] = useState(DEFAULT_NEO_RPC_ADDRESS)
    const [networkMagic, setNetworkMagic] = useState(DEFAULT_NEO_NETWORK_MAGIC)
    const [account, setAccount] = useState<Account | undefined>()

    const contextValue: IAccountContext = {
        accountPassword, setAccountPassword,
        accountDecripted, setAccountDecripted,
        rpcAddress, setRpcAddress,
        networkMagic, setNetworkMagic,
        account, setAccount,
    }

    return (
        <AccountContext.Provider value={contextValue}>{children}</AccountContext.Provider>
    );
}

export const useAccountContext = (): IAccountContext => useContext(AccountContext)