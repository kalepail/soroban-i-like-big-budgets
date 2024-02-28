import { Horizon, Keypair, Networks } from '@stellar/stellar-sdk'
import { $ } from 'bun'

const horizonUrl = 'http://localhost:8000'
const horizon = new Horizon.Server(horizonUrl, { allowHttp: true })

const keypair = Keypair.random()
const secret = keypair.secret()
const pubkey = keypair.publicKey()

try {
    await horizon.friendbot(pubkey).call()
} catch {
    throw new Error(`Issue with ${pubkey} account. Ensure you're running the \`./docker.sh\` network and have run \`bun run deploy.ts\` recently.`)
}
console.log('created account')

await $`bun rimraf target/wasm32-unknown-unknown/release .env.local`
console.log('cleaned target')

await $`soroban contract build`
console.log('built contract')

const contractId = (await $`soroban contract deploy --wasm target/wasm32-unknown-unknown/release/i_like_big_budgets.wasm --rpc-url http://localhost:8000/soroban/rpc --network-passphrase ${Networks.STANDALONE} --source ${secret}`.text()).replace(/\W/g, '')
console.log('deployed contract')

await $`soroban contract bindings typescript --id ${contractId} --rpc-url http://localhost:8000/soroban/rpc --network-passphrase ${Networks.STANDALONE} --output-dir ./i-like-big-budgets-sdk --overwrite`
await $`cd i-like-big-budgets-sdk && npm install && npm run build`
await $`cd i-like-big-budgets-sdk && bun link`
await $`bun install --force`
console.log('generated sdk');

if (!contractId)
    throw new Error('Contract not deployed')

let file = ``
file += `CONTRACT_ID=${contractId}\n`
file += `SECRET=${secret}`

await Bun.write('.env.local', file);
console.log('✅')