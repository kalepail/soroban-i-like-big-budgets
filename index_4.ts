import { Account, Keypair, Networks, Operation, SorobanRpc, TransactionBuilder, nativeToScVal } from "@stellar/stellar-sdk";
import { sorobill } from "./utils/sorobill";

if (
    !Bun.env.CONTRACT_ID
    || !Bun.env.SECRET
) throw new Error('Missing .env.local file. Run `bun run deploy.ts` to create it.')

const rpcUrl = 'http://localhost:8000/soroban/rpc'
const rpc = new SorobanRpc.Server(rpcUrl, { allowHttp: true })

const keypair = Keypair.fromSecret(Bun.env.SECRET)
const pubkey = keypair.publicKey()

const contractId = Bun.env.CONTRACT_ID
const networkPassphrase = Networks.STANDALONE

const source = await rpc
    .getAccount(pubkey)
    .then((account) => new Account(account.accountId(), account.sequenceNumber()))
    .catch(() => { throw new Error(`Issue with ${pubkey} account. Ensure you're running the \`./docker.sh\` network and have run \`bun run deploy.ts\` recently.`) })

const simTx = new TransactionBuilder(source, {
    fee: '0',
    networkPassphrase
})
    .addOperation(Operation.invokeContractFunction({
        contract: contractId,
        function: 'run',
        args: [
            nativeToScVal(15_000, { type: 'u32' }),
            nativeToScVal(10_000, { type: 'u32' }),
            nativeToScVal(50, { type: 'u32' }),
            nativeToScVal(10, { type: 'u32' }),
        ]
    }))
    .setTimeout(0)
    .build()

const sim = await rpc.simulateTransaction(simTx)

if (SorobanRpc.Api.isSimulationSuccess(sim))
    sorobill(simTx, sim);