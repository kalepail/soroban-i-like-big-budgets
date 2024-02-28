import { Account, Address, Horizon, Keypair, Networks, Operation, Soroban, SorobanDataBuilder, SorobanRpc, StrKey, TransactionBuilder, nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";
import { $ } from "bun";
// import { Contract, networks } from "i-like-big-budgets-sdk";

const horizonUrl = 'http://localhost:8000' // 'https://horizon-futurenet.stellar.org'
const rpcUrl = 'http://localhost:8000/soroban/rpc' // 'https://rpc-futurenet.stellar.org'

const contractId = 'CDBWCDAYXMNGJMARLDVDVZPIRJKMSOR4E2V2EYGJPIG3XRUZB2LPLIIC'
const networkPassphrase = Networks.STANDALONE

// const contract = new Contract({
//     ...networks.futurenet,
//     rpcUrl
// });

const horizon = new Horizon.Server(horizonUrl, { allowHttp: true })
const rpc = new SorobanRpc.Server(rpcUrl, { allowHttp: true })

const keypair = Keypair.fromSecret('SAAZ7CF5Z6G6WPUVBWKKTUPRHZF22HMVGZXZRJCXSRKOUIHVLXRB3RDJ') // GCLLN5DW5MIOQUNLANLQ4JAT5JHXLZLARTHDEWO4DT7UPWYZ4LLZOLT3
const pubkey = keypair.publicKey() // StrKey.encodeEd25519PublicKey(Buffer.from(new Array(32).fill(0)))

const source = await rpc
    .getAccount(pubkey)
    .then((account) => new Account(account.accountId(), account.sequenceNumber()))
    .catch(() => horizon.friendbot(pubkey).call())
    .then(() => rpc.getAccount(pubkey))
    .then((account) => new Account(account.accountId(), account.sequenceNumber()))

const simTx = new TransactionBuilder(source, {
    fee: (10_000_000).toString(),
    networkPassphrase
})
    .addOperation(Operation.invokeContractFunction({
        contract: contractId, // networks.futurenet.contractId,
        function: 'run',
        args: [
            nativeToScVal(100, { type: 'u32' })
        ]
    }))
    .setTimeout(0)
    .build()

const simRes = await rpc._simulateTransaction(simTx)

console.log(simRes);

const sorobanData = new SorobanDataBuilder(simRes.transactionData)
    .build();

const tx = TransactionBuilder.cloneFrom(simTx)
    .clearOperations()
    .addOperation(Operation.invokeContractFunction({
        contract: contractId, // networks.futurenet.contractId,
        function: 'run',
        args: [
            nativeToScVal(10_000, { type: 'u32' })
        ]
    }))
    .setSorobanData(sorobanData)
    .build()

tx.sign(keypair)

const sendRes = await rpc._sendTransaction(tx)

console.log(sendRes);

setTimeout(async () => {
    const getRes = await rpc._getTransaction(sendRes.hash)
    console.log(getRes)
}, 5000)