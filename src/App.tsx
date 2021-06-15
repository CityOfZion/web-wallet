import * as React from "react";
import DefaultCard from "./components/DefaultCard";
import RequestCard from "./components/RequestCard";
import ProposalCard from "./components/ProposalCard";
import {useWalletConnect} from "./context/WalletConnectContext";
import {CloseButton, Flex, Spacer, Spinner} from "@chakra-ui/react";
import Header from "./components/Header";
import {useAccountContext} from "./context/AccountContext";
import AccountEntry from "./components/AccountEntry";
import {useEffect, useState} from "react";
import ConnectDapp from "./components/ConnectDapp";
import {SessionTypes} from "@walletconnect/types";

export default function App(): any {
  const walletConnectCtx = useWalletConnect()
  const accountCtx = useAccountContext()
  const [connectingApp, setConnectingApp] = useState(false)
  const [requestOpen, setRequestOpen] = useState<SessionTypes.RequestEvent | undefined>(undefined)

  useEffect(() => {
    setConnectingApp(!walletConnectCtx.sessions.length)
  }, [walletConnectCtx.sessions])

  return (
    <Flex direction="column" w="100vw" minH="100vh" bgImage="url(/bg.png)" color="white">
      <Header/>
      {
        !walletConnectCtx.accounts.length || !accountCtx.accountDecripted ?
          <AccountEntry flex={1}/>
        : !walletConnectCtx.initialized ?
          <Flex flex={1} align="center">
            <Spacer />
            <Spinner />
            <Spacer />
          </Flex>
        : !walletConnectCtx.sessionProposals.length ?
          <ProposalCard flex={1} />
        : requestOpen ?
            <RequestCard requestEvent={requestOpen} closeRequest={() => setRequestOpen(undefined)} flex={1} />
        : connectingApp ?
          <Flex flex={1}>
            <ConnectDapp flex={1}/>
            {!!walletConnectCtx.sessions.length && <CloseButton onClick={() => setConnectingApp(false)}/>}
          </Flex>
        : <DefaultCard openRequest={(e) => setRequestOpen(e)} openConnectingDapp={() => setConnectingApp(true)} />
      }
    </Flex>
  );
}