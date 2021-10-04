import * as React from "react";
import * as ReactDOM from "react-dom";
import {ChakraProvider} from "@chakra-ui/react"
import {
  DEFAULT_APP_METADATA,
  DEFAULT_NETWORKS,
  DEFAULT_LOGGER,
  DEFAULT_METHODS,
  DEFAULT_RELAY_PROVIDER,
} from "./constants";
import App from "./App";
import {WalletConnectContextProvider} from "./context/WalletConnectContext";
import {AccountContextProvider} from "./context/AccountContext";

const wcOptions = {
  appMetadata: DEFAULT_APP_METADATA,
  chainIds: Object.keys(DEFAULT_NETWORKS),
  logger: DEFAULT_LOGGER,
  methods: DEFAULT_METHODS,
  relayServer: DEFAULT_RELAY_PROVIDER
}

ReactDOM.render(
    <>
        <ChakraProvider>
            <WalletConnectContextProvider options={wcOptions}>
                <AccountContextProvider>
                    <App/>
                </AccountContextProvider>
            </WalletConnectContextProvider>
        </ChakraProvider>
    </>,
    document.getElementById("root"),
);
