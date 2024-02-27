import { Account, Address, Horizon, Keypair, Operation, Soroban, SorobanRpc, StrKey, TransactionBuilder, nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";
import { $ } from "bun";
import { Contract, networks } from "i-like-big-budgets-sdk";

const horizonUrl = 'http://localhost:8000' // 'https://horizon-futurenet.stellar.org'
const rpcUrl = 'http://localhost:8000/soroban/rpc' // 'https://rpc-futurenet.stellar.org'
const contractId = 'CDDRE2PWNYL6VKA5DEJWSH7EBUXXDLOKDXZASQ7QW3V5MH5V4O4I7RPK'
// const contract = new Contract({
//     ...networks.futurenet,
//     rpcUrl
// });

const horizon = new Horizon.Server(horizonUrl, {allowHttp: true})
const rpc = new SorobanRpc.Server(rpcUrl, {allowHttp: true})

const pubkey = StrKey.encodeEd25519PublicKey(Buffer.from(new Array(32).fill(0)))
const source = await rpc
    .getAccount(pubkey)
    .then((account) => new Account(account.accountId(), account.sequenceNumber()))
    .catch(() => horizon.friendbot(pubkey).call())
    .then(() => rpc.getAccount(pubkey))
    .then((account) => new Account(account.accountId(), account.sequenceNumber()))

const tx = new TransactionBuilder(source, {
    fee: (10_000_000).toString(),
    networkPassphrase: networks.futurenet.networkPassphrase
})
    .addOperation(Operation.invokeContractFunction({
        contract: contractId, // networks.futurenet.contractId,
        function: 'run',
        args: [
            nativeToScVal(2_000, { type: 'u32' })
        ]
    }))
    .setTimeout(0)
    .build()

const res = await rpc._simulateTransaction(tx)

console.log(res)

// res.events.forEach(async (event) => {
    // console.log(
    //     scValToNative(event.event().body().v0().data())
    // );
    
    // console.log(
        // await $`echo -n "${event.event().body().v0().toXDR('base64')}" > bun ./dec.sh`
    // )

    // console.log(
    //     `'${event.event().body().v0().toXDR('base64')}'`
    // );
// })

// const res = await contract.run({
//     count: 2000
// })

// console.log(res.simulationData);
