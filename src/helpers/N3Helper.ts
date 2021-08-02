import Neon, {rpc, sc} from '@cityofzion/neon-js'
import {Account} from '@cityofzion/neon-core/lib/wallet'
import {JsonRpcRequest, JsonRpcResponse} from "@json-rpc-tools/utils";

export class N3Helper {
    private readonly rpcAddress: string
    private readonly networkMagic: number

    constructor(rpcAddress: string, networkMagic: number) {
        this.rpcAddress = rpcAddress
        this.networkMagic = networkMagic
    }

    rpcCall = async (account: Account | undefined, request: JsonRpcRequest): Promise<JsonRpcResponse> => {
        let result: any

        if (request.method === 'invokefunction') {
            if (!account) {
                throw new Error("No account")
            }

            result = await this.contractInvoke(
              account,
              request.params[0] as string,
              request.params[1] as string,
              ...N3Helper.getInnerParams(request.params));

        } else if (request.method === 'testInvoke') {

            result = await this.testInvoke(
              request.params[0] as string,
              request.params[1] as string,
              ...N3Helper.getInnerParams(request.params));

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

    contractInvoke = async (account: Account, scriptHash: string, operation: string, ...args: any[]): Promise<any> => {
        const contract = new Neon.experimental.SmartContract(
          Neon.u.HexString.fromHex(scriptHash),
          {
              networkMagic: this.networkMagic,
              rpcAddress: this.rpcAddress,
              account: account,
          }
        );

        const convertedArgs = N3Helper.convertParams(args)

        try {
            return await contract.invoke(operation, convertedArgs)
        } catch (e) {
            return N3Helper.convertError(e)
        }
    }

    testInvoke = async (scriptHash: string, operation: string, ...args: any[]): Promise<any> => {
        const contract = new Neon.experimental.SmartContract(
          Neon.u.HexString.fromHex(scriptHash),
          {
              networkMagic: this.networkMagic,
              rpcAddress: this.rpcAddress,
          }
        );

        const convertedArgs = N3Helper.convertParams(args)

        try {
            return await contract.testInvoke(operation, convertedArgs)
        } catch (e) {
            return N3Helper.convertError(e)
        }
    }

    private static convertParams (args: any[]): any[] {
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

    private static getInnerParams(p: any[]) {
        let params: any[] = []
        if (p.length > 2) {
            params = p[2]
        }
        return params;
    }

    private static convertError(e) {
        return {error: {message: e.message, ...e}};
    }
}
