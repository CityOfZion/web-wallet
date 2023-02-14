import * as React from "react";
import DefaultCard from "./components/DefaultCard";
import RequestCard from "./components/RequestCard";
import ProposalCard from "./components/ProposalCard";
import {SessionRequest, useWalletConnect} from "./context/WalletConnectContext";
import {CloseButton, Flex, Spacer, Spinner} from "@chakra-ui/react";
import Header from "./components/Header";
import {useAccountContext} from "./context/AccountContext";
import AccountEntry from "./components/AccountEntry";
import { useCallback, useEffect, useState } from 'react'
import ConnectDapp from "./components/ConnectDapp";
import {NeonWcAdapter} from "./helpers/NeonWcAdapter";
import {DEFAULT_AUTOACCEPT_METHODS, DEFAULT_NETWORKS} from "./constants";

export default function App(): any {
  const walletConnectCtx = useWalletConnect()
  const accountCtx = useAccountContext()
  const [connectingApp, setConnectingApp] = useState(false)
  const [requestOpen, setRequestOpen] = useState<SessionRequest | undefined>(undefined)

  useEffect(() => {
    setConnectingApp(!walletConnectCtx.sessions.length)
  }, [walletConnectCtx.sessions])

  const requestListener = useCallback(async (acc, chain, req: SessionRequest) => {
    const adapter = await NeonWcAdapter.init(DEFAULT_NETWORKS[chain].url || accountCtx.privateRpcAddress)
    
    return await adapter.rpcCall(accountCtx.account, req)
  }, [accountCtx.account, accountCtx.privateRpcAddress])

  useEffect(() => {
    // if the request method is 'testInvoke' or 'multiTestInvoke' we auto-accept it
    walletConnectCtx.autoAcceptIntercept((acc, chain, req: SessionRequest) =>
      DEFAULT_AUTOACCEPT_METHODS.includes(req.params.request.method))

    walletConnectCtx.onRequestListener(requestListener)
  }, [requestListener])

  return (
    <Flex direction="column" w="100vw" minH="100vh" bgImage="url(/bg.png)" color="white">
      <Header/>
      {
        !accountCtx.account || !accountCtx.accountDecripted ?
          <AccountEntry flex={1}/>
          : !walletConnectCtx.initialized ?
          <Flex flex={1} align="center">
            <Spacer/>
            <Spinner/>
            <Spacer/>
          </Flex>
          : walletConnectCtx.sessionProposals.length ?
            <ProposalCard flex={1}/>
            : requestOpen ?
              <RequestCard requestEvent={requestOpen} closeRequest={() => setRequestOpen(undefined)} flex={1}/>
              : connectingApp ?
                <Flex flex={1}>
                  <ConnectDapp flex={1}/>
                  {!!walletConnectCtx.sessions.length && <CloseButton onClick={() => setConnectingApp(false)}/>}
                </Flex>
                :
                <DefaultCard openRequest={(e) => setRequestOpen(e)} openConnectingDapp={() => setConnectingApp(true)}/>
      }
    </Flex>
  );
}
