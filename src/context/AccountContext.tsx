import React, {useContext, useState} from "react";
import {Account} from "@cityofzion/neon-core/lib/wallet";
import {DEFAULT_CHAIN} from "../constants";

interface IAccountContext {
    accountPassword: string | undefined,
    setAccountPassword: React.Dispatch<React.SetStateAction<string | undefined>>,
    accountDecripted: boolean,
    setAccountDecripted: React.Dispatch<React.SetStateAction<boolean>>,
    privateRpcAddress: string,
    setPrivateRpcAddress: React.Dispatch<React.SetStateAction<string>>,
    networkType: string,
    setNetworkType: React.Dispatch<React.SetStateAction<string>>,
    account: Account | undefined,
    setAccount: React.Dispatch<React.SetStateAction<Account | undefined>>,
}

export const AccountContext = React.createContext({} as IAccountContext)

export const AccountContextProvider: React.FC = ({ children }) => {
    const [accountPassword, setAccountPassword] = useState<string | undefined>(undefined)
    const [accountDecripted, setAccountDecripted] = useState(false)
    const [networkType, setNetworkType] = useState(DEFAULT_CHAIN)
    const [privateRpcAddress, setPrivateRpcAddress] = useState<string>('http://localhost')
    const [account, setAccount] = useState<Account | undefined>()

    const contextValue: IAccountContext = {
        accountPassword, setAccountPassword,
        accountDecripted, setAccountDecripted,
        networkType, setNetworkType,
        privateRpcAddress, setPrivateRpcAddress,
        account, setAccount,
    }

    return (
        <AccountContext.Provider value={contextValue}>{children}</AccountContext.Provider>
    );
}

export const useAccountContext = (): IAccountContext => useContext(AccountContext)
