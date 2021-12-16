export const DEFAULT_RELAY_PROVIDER = "wss://relay.walletconnect.org";

export const DEFAULT_METHODS = [
  "invokefunction",
  "testInvoke",
  "multiInvoke",
  "multiTestInvoke",
  "signMessage",
  "verifyMessage",
  "getapplicationlog"
];
export const DEFAULT_AUTOACCEPT_METHODS = ["testInvoke", "multiTestInvoke", "verifyMessage", "getapplicationlog"];

export const DEFAULT_LOGGER = "error";

export const DEFAULT_APP_METADATA = {
  name: "CoZ Wallet Prototype",
  description: "WalletConnect integration Prototype",
  url: "https://coz.io/",
  icons: ["https://raw.githubusercontent.com/CityOfZion/visual-identity/develop/_CoZ%20Branding/_Logo/_Logo%20icon/_PNG%20200x178px/CoZ_Icon_DARKBLUE_200x178px.png"],
};

export const DEFAULT_CHAIN = 'neo3:testnet'
export const DEFAULT_NETWORKS = {
  "neo3:testnet": "https://testnet1.neo.coz.io:443",
  'neo3:mainnet': "http://seed1.neo.org:10332",
  'neo3:private': null
}
