#![cfg(test)]

extern crate std;

use soroban_sdk::Env;

use crate::{Contract, ContractClient};

mod i_like_big_budgets {
    soroban_sdk::contractimport!(
        file = "./target/wasm32-unknown-unknown/release/i_like_big_budgets.optimized.wasm"
    );
}

#[test]
fn test_v1() {
    let env = Env::default();
    let contract_id = env.register_contract(None, Contract);
    let client = ContractClient::new(&env, &contract_id);

    env.budget().reset_unlimited();
    client.run(&Some(1_500), &Some(200), &None, &None, &None, &None);
    env.budget().print();
}

#[test]
fn test_v2() {
    let env = Env::default();
    let contract_id = env.register_contract_wasm(None, i_like_big_budgets::WASM);
    let client = i_like_big_budgets::Client::new(&env, &contract_id);

    env.budget().reset_unlimited();
    client.run(&Some(1_500), &Some(200), &None, &None, &None, &None);
    env.budget().print();
}
