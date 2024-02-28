contract_id=$(soroban contract deploy --wasm target/wasm32-unknown-unknown/release/i_like_big_budgets.wasm --network local --source default)
echo $contract_id