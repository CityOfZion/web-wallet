import * as React from "react";
import {Box, Button, DividerProps, Flex, Input, Spacer, Text, useToast} from "@chakra-ui/react";
import {useWalletConnect} from "../context/WalletConnectContext";

export default function ConnectDapp(props: DividerProps) {
  const walletConnectCtx = useWalletConnect()
  const toast = useToast()

  const handleInput = async (e: any) => {
    try {
      await walletConnectCtx.onURI(e.target.value)
    } catch (e) {
      toast({
        title: "Invalid input",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Flex direction="column" align="center" {...props}>
      <Spacer/>
      <Text fontSize="0.875rem" fontWeight="bold" color="#888888">Connect with an App</Text>
      <Button h="2.75rem" bg="#373d4a" borderRadius={0} mt="1.5rem"
              _hover={{bg: 'black'}} onClick={walletConnectCtx.openScanner}>Scan the QRCode</Button>
      <Flex align="center" mt="2rem" maxW="10rem" w="100%">
        <Box flex={1} h="1px" bg="#888888"/>
        <Text fontSize="0.875rem" color="#888888" mx="0.5rem">Or</Text>
        <Box flex={1} h="1px" bg="#888888"/>
      </Flex>
      <Input onChange={handleInput} borderColor="#373d4a" borderRadius={0}
             maxW="20rem" bg="#1a202b"
             _placeholder={{color: '#373d4a'}} mt="2rem"
             placeholder="Paste the Code " />
      <Spacer/>
    </Flex>
  );
};
