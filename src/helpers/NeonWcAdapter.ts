import {Account} from '@cityofzion/neon-core/lib/wallet'
import { NeonInvoker } from '@cityofzion/neon-invoker'
import { NeonSigner } from '@cityofzion/neon-signer'
import {SessionRequest} from "../context/WalletConnectContext";

export class NeonWcAdapter {
  readonly invoke: NeonInvoker
  private signer = new NeonSigner()

  constructor(invoke: NeonInvoker) {
    this.invoke = invoke
  }

  static init = async (rpcAddress: string): Promise<NeonWcAdapter> => {
    const invoker = await NeonInvoker.init(rpcAddress)

    return new NeonWcAdapter(invoker)
  }

  rpcCall = async (account: Account | undefined, sessionRequest: SessionRequest): Promise<any> => {
    const {
      params: { request },
    } = sessionRequest
    let result: any
    this.invoke.account = account
    this.signer.account = account
    if (request.method === 'invokeFunction') {
      if (!account) {
        throw new Error('No account')
      }

      result = await this.invoke.invokeFunction(request.params)
    } else if (request.method === 'testInvoke') {
      if (!account) {
        throw new Error('No account')
      }

      result = await this.invoke.testInvoke(request.params)
    } else if (request.method === 'signMessage') {
      if (!account) {
        throw new Error('No account')
      }

      result = await this.signer.signMessage(request.params)
    } else if (request.method === 'verifyMessage') {
      result = await this.signer.verifyMessage(request.params)
    } else if (request.method === "traverseIterator") {
      result = await this.invoke.traverseIterator(
        request.params[0],
        request.params[1],
        request.params[2],
      );
    } else {
      throw new Error('Invalid Request method')
    }

    return {
      id: sessionRequest.id,
      jsonrpc: '2.0',
      result,
    }
  }
}
