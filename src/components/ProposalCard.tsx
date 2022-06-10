import * as React from "react";
import Peer from "../components/Peer";
import {Button, DividerProps, Flex, Spacer, Text} from "@chakra-ui/react";
import {useWalletConnect} from "../context/WalletConnectContext";
import {useAccountContext} from "../context/AccountContext";
import {DEFAULT_NAMESPACES} from "../constants";

export default function ProposalCard(props: DividerProps): any {
  const walletConnectCtx = useWalletConnect()
  const accountCtx = useAccountContext()
  const firstProposal = walletConnectCtx.sessionProposals[0]

  const approveSession = async () => {
    await walletConnectCtx.approveSession(firstProposal, [{
      address: accountCtx.account?.address ?? '',
      chain: accountCtx.networkType
    }], DEFAULT_NAMESPACES)
  }

  return (
    <Flex direction="column" align="center" {...props}>
      <Spacer />
      {!!walletConnectCtx.sessionProposals.length &&
        <Flex direction="column" bg="#252b36" w="23rem" boxShadow="dark-lg" p="0.5rem">
          <Peer metadata={firstProposal.params.proposer.metadata} />
          <Text as={'pre'} bg="#00000022" boxShadow="inset 0 2px 3px 0 #00000033" mt="0.9rem" p="0.7rem">
            {JSON.stringify(firstProposal.params.requiredNamespaces, null, 2)}
          </Text>
          <Flex mt="0.75rem">
            <Button flex={1} onClick={approveSession}
                    bg="black" borderRadius={0} _hover={{bg: '#111'}}>
              Approve
            </Button>
            <Button flex={1} onClick={() => walletConnectCtx.rejectSession(firstProposal)}
                    bg="black" borderRadius={0} _hover={{bg: '#111'}} ml="0.5rem">
              Reject
            </Button>
          </Flex>
        </Flex>
      }
      <Spacer />
    </Flex>
  );
}
