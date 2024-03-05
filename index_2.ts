import { Account, Keypair, Networks, Operation, SorobanRpc, TransactionBuilder, nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";

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
let args = [
    [1, 1500, 'u32', 'CPU'], // New error [ "VM call trapped: OutOfFuel", "run" ]
    [1, 200, 'u32', 'MEM'],
    [20, 20, 'u32', 'SET'],
    [40, 40, 'u32', 'GET'],
    [0, 1, 'u32', 'EVENTS'],
    [Buffer.alloc(71_680), Buffer.alloc(71_680), 'bytes', 'TXN'],
]

for (const [small, big, type, kind] of args) {
    try {
        console.log(`\n`);
        console.log(`RUNNING TEST FOR ${kind}`);
        console.log(`--------------------------`);

        const args = [
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
            xdr.ScVal.scvVoid(),
        ]
        const smallArgs = [...args]
        const bigArgs = [...args]

        smallArgs[i] = nativeToScVal(small, { type })
        bigArgs[i] = nativeToScVal(big, { type })

        await run(smallArgs, bigArgs)
    } catch (error) {
        console.error(error)
    } finally {
        i++
        console.log(`--------------------------`);
    }
}

async function run(smallArgs: xdr.ScVal[], bigArgs: xdr.ScVal[]) {
    const source = await rpc
        .getAccount(pubkey)
        .then((account) => new Account(account.accountId(), account.sequenceNumber()))
        .catch(() => { throw new Error(`Issue with ${pubkey} account. Ensure you're running the \`./docker.sh\` network and have run \`bun run deploy.ts\` recently.`) })

    const simTx = new TransactionBuilder(source, {
        fee: '4294967295',
        networkPassphrase
    })
        .addOperation(Operation.invokeContractFunction({
            contract: contractId,
            function: 'run',
            args: smallArgs
        }))
        .setTimeout(0)
        .build()

    const simRes = await rpc.simulateTransaction(simTx)

    if (SorobanRpc.Api.isSimulationSuccess(simRes)) {
        const sorobanData = simRes.transactionData
            .setResourceFee(100_000_000)
            .setResources(100_000_000, 133_120, 66_560) // We _need_ to manually set resources here due to sm sim and big sim resource consumption differences
            .build();

        const tx = TransactionBuilder
            .cloneFrom(simTx)
            .clearOperations()
            .addOperation(Operation.invokeContractFunction({
                contract: contractId,
                function: 'run',
                args: bigArgs
            }))
            .setSorobanData(sorobanData)
            .build()

        tx.sign(keypair)

        const sendRes = await rpc._sendTransaction(tx)

        if (sendRes.status === 'PENDING') {
            await Bun.sleep(5000);
            const getRes = await rpc._getTransaction(sendRes.hash)

            if (getRes.resultMetaXdr) {
                xdr.TransactionMeta
                    .fromXDR(getRes.resultMetaXdr, 'base64')
                    .v3()
                    .sorobanMeta()
                    ?.diagnosticEvents()
                    .forEach((event) => {
                        console.log(
                            scValToNative(event.event().body().v0().data())
                        )
                    })
            } else console.log(getRes)
        } else console.log(sendRes)
    } else console.log(await rpc._simulateTransaction(simTx));
}