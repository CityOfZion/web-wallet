import Neon, {rpc, sc, tx, wallet, u} from '@cityofzion/neon-js'
import {Account} from '@cityofzion/neon-core/lib/wallet'
import {ContractParam} from "@cityofzion/neon-core/lib/sc";
import {WitnessScope} from "@cityofzion/neon-core/lib/tx/components/WitnessScope";
import {randomBytes} from "crypto";
import {SessionRequest} from "../context/WalletConnectContext";

export type Signer = {
  scopes: WitnessScope
  allowedContracts?: string[]
  allowedGroups?: string[]
}

export type ContractInvocation = {
  scriptHash: string
  operation: string
  args: any[]
  abortOnFail?: boolean
}

export type ContractInvocationMulti = {
  signers: Signer[]
  invocations: ContractInvocation[],
  extraSystemFee?: number,
  systemFeeOverride?: number,
  extraNetworkFee?: number,
  networkFeeOverride?: number
}

export type SignMessagePayload = {
  message: string,
  version: number
}

export type SignedMessage = {
  publicKey: string
  data: string
  salt: string
  messageHex: string
}

export class N3Helper {
  private readonly rpcAddress: string
  private readonly networkMagic: number

  constructor(rpcAddress: string, networkMagic: number) {
    this.rpcAddress = rpcAddress
    this.networkMagic = networkMagic
  }

  static init = async (rpcAddress: string, networkMagic?: number): Promise<N3Helper> => {
    return new N3Helper(rpcAddress, networkMagic || (await N3Helper.getMagicOfRpcAddress(rpcAddress)))
  }

  static getMagicOfRpcAddress = async (rpcAddress: string): Promise<number> => {
    const resp: any = await new rpc.RPCClient(rpcAddress).execute(Neon.create.query({
      method: 'getversion',
      params: [],
      id: 1,
      jsonrpc: "2.0"
    }));

    return resp.protocol.network
  }

  rpcCall = async (account: Account | undefined, sessionRequest: SessionRequest): Promise<any> => {
    const { params: {request} } = sessionRequest
    let result: any

    if (request.method === 'invokeFunction') {
      if (!account) {
        throw new Error("No account")
      }

      result = await this.invokeFunction(account, request.params);

    } else if (request.method === 'testInvoke') {
      if (!account) {
        throw new Error("No account")
      }

      result = await this.testInvoke(account, request.params);

    } else if (request.method === 'signMessage') {
      if (!account) {
        throw new Error("No account")
      }

      result = await this.signMessage(account, request.params);

    } else if (request.method === 'verifyMessage') {
      result = await this.verifyMessage(request.params);
    } else if (request.method === 'getapplicationlog') {

      result = await new rpc.RPCClient(this.rpcAddress).getApplicationLog(request.params[0])

    } else {
      throw new Error("Invalid Request method")
    }

    return {
      id: sessionRequest.id,
      jsonrpc: "2.0",
      result
    }
  }

  testInvoke = async (account: Account, cim: ContractInvocationMulti): Promise<any> => {
    const sb = Neon.create.scriptBuilder();

    cim.invocations.forEach((c) => {
      sb.emitContractCall({
        scriptHash: c.scriptHash,
        operation: c.operation,
        args: N3Helper.convertParams(c.args)
      })

      if (c.abortOnFail) {
        sb.emit(0x39)
      }
    })

    const script = sb.build()
    return await new rpc.RPCClient(this.rpcAddress).invokeScript(
      Neon.u.HexString.fromHex(script), N3Helper.buildMultipleSigner(account, cim.signers))
  }

  invokeFunction = async (account: Account, cim: ContractInvocationMulti): Promise<any> => {
    const sb = Neon.create.scriptBuilder();

    cim.invocations.forEach((c) => {
      sb.emitContractCall({
        scriptHash: c.scriptHash,
        operation: c.operation,
        args: N3Helper.convertParams(c.args)
      })

      if (c.abortOnFail) {
        sb.emit(0x39)
      }
    })

    const script = sb.build()

    const rpcClient = new rpc.RPCClient(this.rpcAddress)

    const currentHeight = await rpcClient.getBlockCount();

    const trx = new tx.Transaction({
      script: Neon.u.HexString.fromHex(script),
      validUntilBlock: currentHeight + 100,
      signers: N3Helper.buildMultipleSigner(account, cim.signers)
    })

    const config = {
      rpcAddress: this.rpcAddress,
      networkMagic: this.networkMagic,
      account,
    }

    const systemFeeOverride = cim.systemFeeOverride
      ? u.BigInteger.fromNumber(cim.systemFeeOverride)
      : (
        cim.extraSystemFee
          ? (await Neon.experimental.txHelpers.getSystemFee(trx.script, config, trx.signers)).add(cim.extraSystemFee)
          : undefined
      )

    const networkFeeOverride = cim.networkFeeOverride
      ? u.BigInteger.fromNumber(cim.networkFeeOverride)
      : (
        cim.extraNetworkFee
          ? (await Neon.experimental.txHelpers.calculateNetworkFee(trx, account, config)).add(cim.extraNetworkFee)
          : undefined
      )

    await Neon.experimental.txHelpers.addFees(trx, {
      ...config,
      systemFeeOverride,
      networkFeeOverride,
    })

    trx.sign(account, this.networkMagic)

    return await rpcClient.sendRawTransaction(trx)
  }

  signMessage = (account: Account, message: string | SignMessagePayload): SignedMessage => {
    if (typeof message === 'string') {
      return this.signMessageLegacy(account, message)
    } else if (message.version === 1) {
      return this.signMessageLegacy(account, message.message)
    } else if (message.version === 2) {
      return this.signMessageNew(account, message.message)
    } else {
      throw new Error("Invalid signMessage version")
    }
  }

  signMessageLegacy = (account: Account, message: string): SignedMessage => {
    const salt = randomBytes(16).toString('hex')
    const parameterHexString = u.str2hexstring(salt + message)
    const lengthHex = u.num2VarInt(parameterHexString.length / 2)
    const messageHex = `010001f0${lengthHex}${parameterHexString}0000`

    return {
      publicKey: account.publicKey,
      data: wallet.sign(messageHex, account.privateKey),
      salt,
      messageHex
    }
  }

  signMessageNew = (account: Account, message: string): SignedMessage => {
    const salt = randomBytes(16).toString('hex')
    const messageHex = u.str2hexstring(message)

    return {
      publicKey: account.publicKey,
      data: wallet.sign(messageHex, account.privateKey, salt),
      salt,
      messageHex
    }
  }

  verifyMessage = (verifyArgs: SignedMessage): boolean => {
    return wallet.verify(verifyArgs.messageHex, verifyArgs.data, verifyArgs.publicKey)
  }

  getGasBalance = async (account: Account): Promise<number> => {
    const rpcClient = new rpc.RPCClient(this.rpcAddress)
    const response = await rpcClient.invokeFunction('0xd2a4cff31913016155e38e474a2c06d08be276cf',
      "balanceOf",
      [sc.ContractParam.hash160(account.address)]
    );
    return parseInt(response.stack[0].value as string) / Math.pow(10, 8)
  }

  private static convertParams(args: any[]): ContractParam[] {
    return args.map(a => (
      a.value === undefined ? a :
        a.type === 'Address'
          ? sc.ContractParam.hash160(a.value)
          : a.type === 'ScriptHash'
          ? sc.ContractParam.hash160(Neon.u.HexString.fromHex(a.value))
          : a.type === 'Array'
            ? sc.ContractParam.array(...N3Helper.convertParams(a.value))
            : a
    ))
  }

  private static buildSigner(account: Account, signerEntry?: Signer) {
    const signer = new tx.Signer({
      account: account.scriptHash
    })

    signer.scopes = signerEntry?.scopes ?? WitnessScope.CalledByEntry
    if (signerEntry?.allowedContracts) {
      signer.allowedContracts = signerEntry.allowedContracts.map((ac) => Neon.u.HexString.fromHex(ac))
    }
    if (signerEntry?.allowedGroups) {
      signer.allowedGroups = signerEntry.allowedGroups.map((ac) => Neon.u.HexString.fromHex(ac))
    }

    return signer
  }

  private static buildMultipleSigner(account: Account, signers: Signer[]) {
    return !signers?.length ? [N3Helper.buildSigner(account)] : signers.map((s) => N3Helper.buildSigner(account, s))
  }

  private static convertError(e) {
    return {error: {message: e.message, ...e}};
  }
}
