import Neon, {rpc, sc, tx, wallet, u} from '@cityofzion/neon-js'
import {Account} from '@cityofzion/neon-core/lib/wallet'
import {JsonRpcRequest, JsonRpcResponse} from "@json-rpc-tools/utils";
import {ContractParam} from "@cityofzion/neon-core/lib/sc";
import {WitnessScope} from "@cityofzion/neon-core/lib/tx/components/WitnessScope";
import {randomBytes} from "crypto";

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
  invocations: ContractInvocation[]
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

  rpcCall = async (account: Account | undefined, request: JsonRpcRequest): Promise<JsonRpcResponse> => {
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

      const {jsonrpc, ...queryLike} = request
      result = await new rpc.RPCClient(this.rpcAddress).execute(Neon.create.query({...queryLike, jsonrpc: "2.0"}));

    }

    return {
      id: request.id,
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

    await Neon.experimental.txHelpers.addFees(trx, {
      rpcAddress: this.rpcAddress,
      networkMagic: this.networkMagic,
      account
    })

    trx.sign(account, this.networkMagic)

    return await rpcClient.sendRawTransaction(trx)
  }

  signMessage = (account: Account, message: string | {message: string, legacy: boolean}): SignedMessage => {
    if (message instanceof Object) {
      if (!message.legacy) {
        return this.signMessageNew(account, message.message)
      } else {
        return this.signMessageLegacy(account, message.message)
      }
    } else {
      return this.signMessageLegacy(account, message)
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
