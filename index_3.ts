import { Account, Keypair, Networks, Operation, SorobanRpc, TransactionBuilder, nativeToScVal, xdr } from "@stellar/stellar-sdk";
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

let i = 0
let args: [number, string][] = [
    [15_000, 'CPU'],
    [10_000, 'MEMORY'],
    [25, 'STORAGE'], // NOTE if this is 50 you get a different error. Because why not?!
    [10, 'EVENTS'],
]

for (const [big, type] of args) {
    try {
        console.log(`\n`);
        console.log(`RUNNING TEST FOR ${type}`);
        console.log(`--------------------------`);

        const args = [
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
        ]
        const bigArgs = [...args]

        bigArgs[i] = nativeToScVal(big, { type: 'u32' })

        await run(bigArgs)
    } catch (error) {
        console.error(error)
    } finally {
        i++
        console.log(`--------------------------`);
    }
}

async function run(args: xdr.ScVal[]) {
    const source = await rpc
        .getAccount(pubkey)
        .then((account) => new Account(account.accountId(), account.sequenceNumber()))
        .catch(() => { throw new Error(`Issue with ${pubkey} account. Ensure you're running the \`./docker.sh\` network and have run \`bun run deploy.ts\` recently.`) })

    const simTx = new TransactionBuilder(source, {
        fee: (2 ** 32 - 1).toString(),
        networkPassphrase
    })
        .addOperation(Operation.invokeContractFunction({
            contract: contractId,
            function: 'run',
            args
        }))
        .setTimeout(0)
        .build()

    const sim = await rpc.simulateTransaction(simTx)

    if (SorobanRpc.Api.isSimulationSuccess(sim))
        sorobill(sim);
}