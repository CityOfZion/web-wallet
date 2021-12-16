import Neon, {rpc, sc, tx, wallet, u} from '@cityofzion/neon-js'
import {Account} from '@cityofzion/neon-core/lib/wallet'
import {JsonRpcRequest, JsonRpcResponse} from "@json-rpc-tools/utils";
import {ContractParam} from "@cityofzion/neon-core/lib/sc";
import {WitnessScope} from "@cityofzion/neon-core/lib/tx/components/WitnessScope";
import {randomBytes} from "crypto";

export type Signer = {
  scope: WitnessScope
  allowedContracts?: string[]
  allowedGroups?: string[]
}

export type ContractInvocation = {
  scriptHash: string
  operation: string
  args: any[]
  abortOnFail?: boolean
  signer?: Signer
}

export type ContractInvocationMulti = {
  signer: Signer[]
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

    if (request.method === 'invokefunction') {
      if (!account) {
        throw new Error("No account")
      }

      result = await this.contractInvoke(account, request.params[0]);

    } else if (request.method === 'testInvoke') {
      if (!account) {
        throw new Error("No account")
      }

      result = await this.testInvoke(account, request.params[0]);

    } else if (request.method === 'multiInvoke') {
      if (!account) {
        throw new Error("No account")
      }

      result = await this.multiInvoke(account, request.params);

    } else if (request.method === 'multiTestInvoke') {
      if (!account) {
        throw new Error("No account")
      }

      result = await this.multiTestInvoke(account, request.params);

    } else if (request.method === 'signMessage') {
      if (!account) {
        throw new Error("No account")
      }

      result = await this.signMessage(account, request.params);

    } else if (request.method === 'verifyMessage') {
      result = await this.verifyMessage(request.params);
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

  contractInvoke = async (account: Account, call: ContractInvocation): Promise<any> => {
    const contract = new Neon.experimental.SmartContract(
      Neon.u.HexString.fromHex(call.scriptHash),
      {
        networkMagic: this.networkMagic,
        rpcAddress: this.rpcAddress,
        account: account,
      }
    );

    const convertedArgs = N3Helper.convertParams(call.args)

    try {
      return await contract.invoke(call.operation, convertedArgs, [N3Helper.buildSigner(account, call.signer)])
    } catch (e) {
      return N3Helper.convertError(e)
    }
  }

  testInvoke = async (account: Account, call: ContractInvocation): Promise<any> => {
    const convertedArgs = N3Helper.convertParams(call.args)

    try {
      return await new rpc.RPCClient(this.rpcAddress).invokeFunction(
        call.scriptHash,
        call.operation,
        convertedArgs,
        [N3Helper.buildSigner(account, call.signer)])
    } catch (e) {
      return N3Helper.convertError(e)
    }
  }

  multiTestInvoke = async (account: Account, cim: ContractInvocationMulti): Promise<any> => {
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
      Neon.u.HexString.fromHex(script), N3Helper.buildMultipleSigner(account, cim.signer))
  }

  multiInvoke = async (account: Account, cim: ContractInvocationMulti): Promise<any> => {
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
      signers: N3Helper.buildMultipleSigner(account, cim.signer)
    })

    console.log(trx)

    await Neon.experimental.txHelpers.addFees(trx, {
      rpcAddress: this.rpcAddress,
      networkMagic: this.networkMagic,
      account
    })

    trx.sign(account, this.networkMagic)

    return await rpcClient.sendRawTransaction(trx)
  }

  signMessage = (account: Account, message: string): SignedMessage => {
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

    signer.scopes = signerEntry?.scope ?? WitnessScope.CalledByEntry
    if (signerEntry?.allowedContracts) {
      signer.allowedContracts = signerEntry.allowedContracts.map((ac) => Neon.u.HexString.fromHex(ac))
    }
    if (signerEntry?.allowedGroups) {
      signer.allowedGroups = signerEntry.allowedGroups.map((ac) => Neon.u.HexString.fromHex(ac))
    }

    return signer
  }

  private static buildMultipleSigner(account: Account, signers: Signer[]) {
    return !signers.length ? [N3Helper.buildSigner(account)] : signers.map((s) => N3Helper.buildSigner(account, s))
  }

  private static convertError(e) {
    return {error: {message: e.message, ...e}};
  }
}
