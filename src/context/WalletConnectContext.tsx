import React, {useCallback, useContext, useEffect, useState} from "react";
import Client, {CLIENT_EVENTS} from "@walletconnect/client";
import {SessionTypes} from "@walletconnect/types";
import {
  DEFAULT_APP_METADATA,
  DEFAULT_CHAIN_ID,
  DEFAULT_LOGGER,
  DEFAULT_METHODS,
  DEFAULT_RELAY_PROVIDER,
  DEFAULT_NEO_RPC_ADDRESS,
  DEFAULT_NEO_NETWORK_MAGIC
} from "../constants";
import {ERROR, getAppMetadata, getError} from "@walletconnect/utils";
import {N3Helper} from "../helpers/N3Helper";
import {Account} from "@cityofzion/neon-core/lib/wallet/Account";
import KeyValueStorage from "keyvaluestorage";
import {formatJsonRpcError, JsonRpcRequest, JsonRpcResponse} from "@json-rpc-tools/utils";

interface IWalletConnectContext {
  wcClient: Client | undefined,
  setWcClient: React.Dispatch<React.SetStateAction<Client | undefined>>,
  storage: KeyValueStorage | undefined,
  setStorage: React.Dispatch<React.SetStateAction<KeyValueStorage | undefined>>,
  neonHelper: N3Helper | undefined,
  setNeonHelper: React.Dispatch<React.SetStateAction<N3Helper | undefined>>,
  sessionProposals: SessionTypes.Proposal[],
  setSessionProposals: React.Dispatch<React.SetStateAction<SessionTypes.Proposal[]>>,
  initialized: boolean,
  setInitialized: React.Dispatch<React.SetStateAction<boolean>>,
  chains: string[],
  setChains: React.Dispatch<React.SetStateAction<string[]>>,
  accounts: Account[],
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>,
  sessions: SessionTypes.Created[],
  setSessions: React.Dispatch<React.SetStateAction<SessionTypes.Created[]>>,
  requests: SessionTypes.RequestEvent[],
  setRequests: React.Dispatch<React.SetStateAction<SessionTypes.RequestEvent[]>>,
  results: any[],
  setResults: React.Dispatch<React.SetStateAction<any[]>>,

  initClient: () => Promise<void>,
  resetApp: () => Promise<void>,
  subscribeToEvents: () => void,
  checkPersistedState: () => Promise<void>,
  approveAndMakeRequest: (request: JsonRpcRequest) => Promise<JsonRpcResponse<any>>,
  makeRequest: (request: JsonRpcRequest) => Promise<JsonRpcResponse<any>>,
  checkApprovedRequest: (request: JsonRpcRequest) => Promise<boolean | undefined>,
  onURI: (data: any) => Promise<void>,
  getPeerOfRequest: (requestEvent: SessionTypes.RequestEvent) => Promise<SessionTypes.Peer>,
  approveSession: (proposal: SessionTypes.Proposal) => Promise<void>,
  accountsAsString: (accounts: Account[]) => string[],
  rejectSession: (proposal: SessionTypes.Proposal) => Promise<void>,
  disconnect: (topic: string) => Promise<void>,
  removeFromPending: (requestEvent: SessionTypes.RequestEvent) => Promise<void>,
  respondRequest: (topic: string, response: JsonRpcResponse) => Promise<void>,
  approveRequest: (requestEvent: SessionTypes.RequestEvent) => Promise<void>,
  rejectRequest: (requestEvent: SessionTypes.RequestEvent) => Promise<void>,
}

export const WalletConnectContext = React.createContext({} as IWalletConnectContext)

export const WalletConnectContextProvider: React.FC = ({children}) => {
  const [wcClient, setWcClient] = useState<Client | undefined>(undefined)
  const [storage, setStorage] = useState<KeyValueStorage | undefined>(undefined)
  const [neonHelper, setNeonHelper] = useState<N3Helper | undefined>(undefined)
  const [sessionProposals, setSessionProposals] = useState<SessionTypes.Proposal[]>([])
  const [initialized, setInitialized] = useState<boolean>(false)
  const [chains, setChains] = useState<string[]>([DEFAULT_CHAIN_ID])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [sessions, setSessions] = useState<SessionTypes.Created[]>([])
  const [requests, setRequests] = useState<SessionTypes.RequestEvent[]>([])
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    setNeonHelper(new N3Helper(DEFAULT_NEO_RPC_ADDRESS, DEFAULT_NEO_NETWORK_MAGIC))
    setStorage(new KeyValueStorage())
  }

  const initClient = async () => {
    setWcClient(await Client.init({
      controller: true,
      relayProvider: DEFAULT_RELAY_PROVIDER,
      logger: DEFAULT_LOGGER,
      storage,
    }));
  };

  const resetApp = async () => {
    setWcClient(undefined)
    setInitialized(false)
    setChains([])
    setAccounts([])
    setSessions([])
    setRequests([])
    setResults([])
    await init()
  }

  const checkPersistedState = useCallback(async () => {
    if (typeof wcClient === "undefined") {
      throw new Error("Client is not initialized");
    }
    setSessions(wcClient.session.values)
    setRequests(wcClient.session.history.pending)
    console.log('checkPersistedState done')
    setInitialized(true)
  }, [wcClient]);

  // ---- MAKE REQUESTS AND SAVE/CHECK IF APPROVED ------------------------------//

  const approveAndMakeRequest = async (request: JsonRpcRequest) => {
    storage?.setItem(`request-${JSON.stringify(request)}`, true)
    return await makeRequest(request)
  }

  const makeRequest = useCallback(async (request: JsonRpcRequest) => {
    if (!neonHelper) {
      throw new Error("no RPC client")
    }
    // TODO: allow multiple accounts
    return await neonHelper.rpcCall(accounts[0], request);
  }, [accounts, neonHelper])

  const checkApprovedRequest = useCallback(async (request: JsonRpcRequest) => {
    return await storage?.getItem<boolean>(`request-${JSON.stringify(request)}`)
  }, [storage])

  const respondRequest = useCallback(async (topic: string, response: JsonRpcResponse) => {
    if (typeof wcClient === "undefined") {
      throw new Error("Client is not initialized");
    }
    await wcClient.respond({topic, response});
  }, [wcClient]);

  const subscribeToEvents = useCallback(() => {
    console.log("ACTION", "subscribeToEvents");

    if (typeof wcClient === "undefined") {
      throw new Error("Client is not initialized");
    }

    wcClient.on(CLIENT_EVENTS.session.proposal, (proposal: SessionTypes.Proposal) => {
      if (typeof wcClient === "undefined") {
        throw new Error("Client is not initialized");
      }
      console.log("EVENT", "session_proposal");
      const unsupportedChains = [];
      proposal.permissions.blockchain.chains.forEach(chainId => {
        if (chains.includes(chainId)) return;
        unsupportedChains.push(chainId);
      });
      if (unsupportedChains.length) {
        return wcClient.reject({proposal});
      }
      const unsupportedMethods = [];
      proposal.permissions.jsonrpc.methods.forEach(method => {
        if (DEFAULT_METHODS.includes(method)) return;
        unsupportedMethods.push(method);
      });
      if (unsupportedMethods.length) {
        return wcClient.reject({proposal});
      }
      setSessionProposals((old) => [...old, proposal]);
    });

    wcClient.on(
      CLIENT_EVENTS.session.request,
      async (requestEvent: SessionTypes.RequestEvent) => {
        // tslint:disable-next-line
        console.log("EVENT", CLIENT_EVENTS.session.request, requestEvent.request);
        try {
          const alreadyApproved = await checkApprovedRequest(requestEvent.request);
          if (!alreadyApproved) {
            setRequests((old) => {
              return [
                ...(old.filter((i) => i.request.id !== requestEvent.request.id)),
                requestEvent
              ]
            })
          } else {
            const response = await makeRequest(requestEvent.request)
            await respondRequest(requestEvent.topic, response);
          }
        } catch (e) {
          const response = formatJsonRpcError(requestEvent.request.id, e.message);
          await respondRequest(requestEvent.topic, response);
        }
      },
    );

    wcClient.on(CLIENT_EVENTS.session.created, () => {
      if (typeof wcClient === "undefined") {
        throw new Error("Client is not initialized");
      }
      console.log("EVENT", "session_created");
      setSessions(wcClient.session.values)
    });

    wcClient.on(CLIENT_EVENTS.session.deleted, () => {
      if (typeof wcClient === "undefined") {
        throw new Error("Client is not initialized");
      }
      console.log("EVENT", "session_deleted");
      setSessions(wcClient.session.values)
    });
  }, [chains, checkApprovedRequest, makeRequest, respondRequest, wcClient]);

  useEffect(() => {
    if (wcClient) {
      subscribeToEvents()
      checkPersistedState()
    }
  }, [wcClient, subscribeToEvents, checkPersistedState])

  const onURI = async (data: any) => {
    const uri = typeof data === "string" ? data : "";
    if (!uri) return;
    if (typeof wcClient === "undefined") {
      throw new Error("Client is not initialized");
    }
    await wcClient.pair({uri});
  };

  const getPeerOfRequest = async (requestEvent: SessionTypes.RequestEvent) => {
    if (typeof wcClient === "undefined") {
      throw new Error("Client is not initialized");
    }
    const {peer} = await wcClient.session.get(requestEvent.topic);
    return peer
  };

  const approveSession = async (proposal: SessionTypes.Proposal) => {
    console.log("ACTION", "approveSession");
    if (typeof wcClient === "undefined") {
      throw new Error("Client is not initialized");
    }
    if (typeof accounts === "undefined") {
      throw new Error("Accounts is undefined");
    }
    const accs = accounts.filter(account => {
      const chainId = accAsStr(account).split("@")[1];
      return proposal.permissions.blockchain.chains.includes(chainId);
    });
    const response = {
      state: {accounts: accountsAsString(accs)},
      metadata: getAppMetadata() || DEFAULT_APP_METADATA,
    };
    const session = await wcClient.approve({proposal, response});
    setSessionProposals((old) => old.filter(i => i !== proposal))
    setSessions([session]);
  };

  const accountsAsString = (accounts: Account[]) => {
    return accounts.map(acc => accAsStr(acc));
  }

  const accAsStr = (acc: Account) => `${acc.address}@${DEFAULT_CHAIN_ID}`

  const rejectSession = async (proposal: SessionTypes.Proposal) => {
    console.log("ACTION", "rejectSession");
    if (typeof wcClient === "undefined") {
      throw new Error("Client is not initialized");
    }
    await wcClient.reject({proposal});
    setSessionProposals((old) => old.filter(i => i !== proposal))
  };

  const disconnect = async (topic: string) => {
    console.log("ACTION", "disconnect");
    if (typeof wcClient === "undefined") {
      throw new Error("Client is not initialized");
    }
    await wcClient.disconnect({
      topic,
      reason: getError(ERROR.USER_DISCONNECTED),
    });
  };

  const removeFromPending = async (requestEvent: SessionTypes.RequestEvent) => {
    setRequests(requests.filter(x => x.request.id !== requestEvent.request.id));
  };

  const approveRequest = async (requestEvent: SessionTypes.RequestEvent) => {
    if (typeof wcClient === "undefined") {
      throw new Error("Client is not initialized");
    }
    try {
      const response = await approveAndMakeRequest(requestEvent.request)
      await wcClient.respond({
        topic: requestEvent.topic,
        response,
      });
    } catch (error) {
      console.error(error);
      await wcClient.respond({
        topic: requestEvent.topic,
        response: formatJsonRpcError(requestEvent.request.id, "Failed or Rejected Request"),
      });
    }

    await removeFromPending(requestEvent);
  };

  const rejectRequest = async (requestEvent: SessionTypes.RequestEvent) => {
    if (typeof wcClient === "undefined") {
      throw new Error("Client is not initialized");
    }
    await wcClient.respond({
      topic: requestEvent.topic,
      response: formatJsonRpcError(requestEvent.request.id, "Failed or Rejected Request"),
    });
    await removeFromPending(requestEvent);
  };

  const contextValue: IWalletConnectContext = {
    wcClient,
    setWcClient,
    storage,
    setStorage,
    neonHelper,
    setNeonHelper,
    sessionProposals,
    setSessionProposals,
    initialized,
    setInitialized,
    chains,
    setChains,
    accounts,
    setAccounts,
    sessions,
    setSessions,
    requests,
    setRequests,
    results,
    setResults,

    initClient,
    resetApp,
    subscribeToEvents,
    checkPersistedState,
    approveAndMakeRequest,
    makeRequest,
    checkApprovedRequest,
    onURI,
    getPeerOfRequest,
    approveSession,
    accountsAsString,
    rejectSession,
    disconnect,
    removeFromPending,
    respondRequest,
    approveRequest,
    rejectRequest,
  }

  return (
    <WalletConnectContext.Provider value={contextValue}>{children}</WalletConnectContext.Provider>
  );
}

export const useWalletConnect = () => useContext(WalletConnectContext)