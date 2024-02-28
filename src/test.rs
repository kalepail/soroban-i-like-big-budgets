#![cfg(test)]

use std::println;
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

    // env.budget().reset_limits(100000000, 41943040);
    env.budget().reset_unlimited();

    let count = client.run(&10_000);

    env.budget().print();
    // Cpu limit: 18446744073709551615; used: 117728669
    // Mem limit: 18446744073709551615; used: 5251568

    println!("{:?}", count);
}

#[test]
fn test_v2() {
    let env = Env::default();
    let contract_id = env.register_contract_wasm(None, i_like_big_budgets::WASM);
    let client = i_like_big_budgets::Client::new(&env, &contract_id);

    // env.budget().reset_limits(100000000, 41943040);
    env.budget().reset_unlimited();

    let count = client.run(&10_000);

    env.budget().print();
    // Cpu limit: 18446744073709551615; used: 161241329
    // Mem limit: 18446744073709551615; used: 7451375

    println!("{:?}", count);
}