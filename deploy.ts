import { Horizon, Keypair, Networks } from '@stellar/stellar-sdk'
import { $ } from 'bun'

await $`bun rimraf target/wasm32-unknown-unknown/release .env.local`
console.log('cleaned target')

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

await $`soroban contract build`
console.log('built contract')

await $`soroban network add kalenet --rpc-url http://localhost:8000/soroban/rpc --network-passphrase ${Networks.STANDALONE}`
await $`soroban keys add kalecount --secret-key`.env({ ...process.env, SOROBAN_SECRET_KEY: secret })

await $`soroban contract optimize --wasm target/wasm32-unknown-unknown/release/i_like_big_budgets.wasm`
const contractId = (await $`soroban contract deploy --wasm target/wasm32-unknown-unknown/release/i_like_big_budgets.optimized.wasm --network kalenet --source kalecount`.text()).replace(/\W/g, '')
console.log('deployed contract')

if (!contractId)
    throw new Error('Contract not deployed')

await $`soroban contract invoke --id ${contractId} --network kalenet --source kalecount -- init`
console.log('initialized contract');

let file = ``
file += `CONTRACT_ID=${contractId}\n`
file += `SECRET=${secret}`

await Bun.write('.env.local', file);
console.log('✅')