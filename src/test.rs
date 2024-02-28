#![cfg(test)]

extern crate std;

use soroban_sdk::Env;

use crate::{Contract, ContractClient};

mod i_like_big_budgets {
    soroban_sdk::contractimport!(
        file = "./target/wasm32-unknown-unknown/release/i_like_big_budgets.wasm"
    );
}

#[test]
fn test_v1() {
    let env = Env::default();
    let contract_id = env.register_contract(None, Contract);
    let client = ContractClient::new(&env, &contract_id);

    env.budget().reset_unlimited();
    client.run(&Some(12_000), &None, &None, &None);
    env.budget().print();

    env.budget().reset_unlimited();
    client.run(&None, &Some(10_000), &None, &None);
    env.budget().print();

    env.budget().reset_unlimited();
    client.run(&None, &None, &Some(30), &None);
    env.budget().print();

    env.budget().reset_unlimited();
    client.run(&None, &None, &None, &Some(10));
    env.budget().print();
}

#[test]
fn test_v2() {
    let env = Env::default();
    let contract_id = env.register_contract_wasm(None, i_like_big_budgets::WASM);
    let client = i_like_big_budgets::Client::new(&env, &contract_id);

    env.budget().reset_unlimited();
    client.run(&Some(12_000), &None, &None, &None);
    env.budget().print();

    env.budget().reset_unlimited();
    client.run(&None, &Some(10_000), &None, &None);
    env.budget().print();

    env.budget().reset_unlimited();
    client.run(&None, &None, &Some(30), &None);
    env.budget().print();

    env.budget().reset_unlimited();
    client.run(&None, &None, &None, &Some(10));
    env.budget().print();
}
