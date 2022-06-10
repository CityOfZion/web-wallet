import * as React from "react";
import * as ReactDOM from "react-dom";
import {ChakraProvider} from "@chakra-ui/react"
import {
  DEFAULT_APP_METADATA,
  DEFAULT_LOGGER,
  DEFAULT_RELAY_PROVIDER,
  DEFAULT_PROJECT_ID,
} from "./constants";
import App from "./App";
import {WalletConnectContextProvider} from "./context/WalletConnectContext";
import {AccountContextProvider} from "./context/AccountContext";

const wcOptions = {
  appMetadata: DEFAULT_APP_METADATA,
  logger: DEFAULT_LOGGER,
  relayServer: DEFAULT_RELAY_PROVIDER,
  projectId: DEFAULT_PROJECT_ID
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
