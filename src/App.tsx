import * as React from "react";
import Scanner from "./components/Scanner";
import DefaultCard from "./cards/DefaultCard";
import RequestCard from "./cards/RequestCard";
import ProposalCard from "./cards/ProposalCard";
import SessionCard from "./cards/SessionCard";
import {useWalletConnect} from "./context/WalletConnectContext";
import {Flex, Spinner} from "@chakra-ui/react";
import Header from "./components/Header";
import {useAccountContext} from "./context/AccountContext";
import AccountEntry from "./components/AccountEntry";
import {Step} from "./helpers";

export default function App() {
    const walletConnectCtx = useWalletConnect()
    const accountCtx = useAccountContext()

    const isProposalStep = (card: Step.All): card is Step.Proposal => {
        return card.type === "proposal";
    }

    const isSessionStep = (card: Step.All): card is Step.Session => {
        return card.type === "session";
    }

    const isRequestStep = (card: Step.All): card is Step.Request => {
        return card.type === "request";
    }

    return (
        <Flex direction="column" w="100vw" minH="100vh" bgImage="url(/bg.png)" color="white">
            <Header/>
            {
                walletConnectCtx.loading ?
                    <Spinner />
                : !walletConnectCtx.accounts.length || !accountCtx.accountDecripted ?
                    <AccountEntry flex={1} />
                : isProposalStep(walletConnectCtx.step) ?
                    <ProposalCard
                        proposal={walletConnectCtx.step.data.proposal}
                        approveSession={walletConnectCtx.approveSession}
                        rejectSession={walletConnectCtx.rejectSession}
                    />
                : isRequestStep(walletConnectCtx.step) ?
                    <RequestCard
                        chainId={walletConnectCtx.step.data.requestEvent.chainId || walletConnectCtx.chains[0]}
                        requestEvent={walletConnectCtx.step.data.requestEvent}
                        metadata={walletConnectCtx.step.data.peer.metadata}
                        approveRequest={walletConnectCtx.approveRequest}
                        rejectRequest={walletConnectCtx.rejectRequest}
                    />
                : isSessionStep(walletConnectCtx.step) ?
                    <SessionCard session={walletConnectCtx.step.data.session} resetCard={walletConnectCtx.resetStep} disconnect={walletConnectCtx.disconnect}/>
                : <DefaultCard
                    accounts={walletConnectCtx.accountsAsString(walletConnectCtx.accounts)}
                    sessions={walletConnectCtx.sessions}
                    requests={walletConnectCtx.requests}
                    openSession={walletConnectCtx.openSession}
                    openRequest={walletConnectCtx.openRequest}
                    openScanner={walletConnectCtx.openScanner}
                    onURI={walletConnectCtx.onURI}
                />
            }
            {walletConnectCtx.scanner && (
                <Scanner
                    onValidate={walletConnectCtx.onScannerValidate}
                    onScan={walletConnectCtx.onScannerScan}
                    onError={walletConnectCtx.onScannerError}
                    onClose={walletConnectCtx.closeScanner}
                />
            )}
        </Flex>
    );
}