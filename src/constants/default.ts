import {SessionTypes} from "@walletconnect/types";

export const DEFAULT_RELAY_PROVIDER = "wss://relay.walletconnect.com";

export const DEFAULT_PROJECT_ID = '56de852a69580b46d61b53f7b3922ce1';

export const DEFAULT_METHODS = [
  "invokeFunction",
  "testInvoke",
  "signMessage",
  "verifyMessage",
  "getapplicationlog",
  "getrawmempool",
  "getcontractstate",
  "findstates",
  "traverseIterator",
];
export const DEFAULT_AUTOACCEPT_METHODS = [
  "testInvoke",
  "verifyMessage",
  "getapplicationlog",
  "getrawmempool",
  "getcontractstate",
  "findstates",
  "traverseIterator",
];

export const DEFAULT_LOGGER = "error";

export const DEFAULT_APP_METADATA = {
  name: "CoZ Wallet Prototype",
  description: "WalletConnect integration Prototype",
  url: "https://coz.io/",
  icons: ["https://raw.githubusercontent.com/CityOfZion/visual-identity/develop/_CoZ%20Branding/_Logo/_Logo%20icon/_PNG%20200x178px/CoZ_Icon_DARKBLUE_200x178px.png"],
};

export const DEFAULT_CHAIN = 'neo3:testnet'
export const DEFAULT_NETWORKS = {
  "neo3:testnet": { url: "https://testnet1.neo.coz.io:443", name: 'Testnet' },
  'neo3:mainnet': { url: "http://seed1.neo.org:10332", name: 'Mainnet' },
  'neo3:private': { url: null, name: 'Private Network' }
}
export const DEFAULT_BLOCKCHAINS = ['neo3'] as const
export const DEFAULT_NAMESPACES: SessionTypes.Namespaces = {
  [DEFAULT_BLOCKCHAINS[0]]: {
    accounts: [], // will be overridden
    methods: [...DEFAULT_METHODS],
    events: []
  }
}
