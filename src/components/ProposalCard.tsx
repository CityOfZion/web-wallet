import * as React from "react";
import Peer from "../components/Peer";
import {Button, DividerProps, Flex, Image, Spacer, Text} from "@chakra-ui/react";
import {useWalletConnect} from "../context/WalletConnectContext";

export default function ProposalCard(props: DividerProps) {
  const walletConnectCtx = useWalletConnect()
  const firstProposal = walletConnectCtx.sessionProposals[0]

  return (
    <Flex direction="column" align="center" {...props}>
      <Spacer />
      {!!walletConnectCtx.sessionProposals.length &&
        <Flex direction="column" bg="#252b36" w="23rem" boxShadow="dark-lg" p="0.5rem">
          <Peer metadata={firstProposal.proposer.metadata} />
          <Flex direction="column" bg="#00000022" boxShadow="inset 0 2px 3px 0 #00000033" mt="0.9rem" p="0.7rem">
          {!!firstProposal.permissions.blockchain.chains.length ? (
            <>
              <Text fontSize="0.875rem" color="#888888" fontWeight="bold">Chains</Text>
              {firstProposal.permissions.blockchain.chains.map(chainId => (
                <Flex key={chainId} align="center" mt="0.5rem">
                  <Image w="1.875rem" src="https://cryptologos.cc/logos/neo-neo-logo.svg"/>
                  <Text fontSize="0.875rem" ml="0.5rem">Neo3</Text>
                </Flex>
              ))}
            </>
          ) : null}
          {!!firstProposal.permissions.jsonrpc.methods.length ? (
            <>
              <Text fontSize="0.875rem" color="#888888" fontWeight="bold" mt="1.5rem">Methods</Text>
              <Text fontSize="0.875rem" mt="0.5rem">{firstProposal.permissions.jsonrpc.methods.join(', ')}</Text>
            </>
          ) : null}
          </Flex>
          <Flex mt="0.75rem">
            <Button flex={1} onClick={() => walletConnectCtx.approveSession(firstProposal)}
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
};
