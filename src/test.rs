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

    let hashes = client.run(&2_000);

    env.budget().print();
    // Cpu limit: 18446744073709551615; used: 628491880
    // Mem limit: 18446744073709551615; used: 48823424

    println!("{:?}", hashes.len());
}

#[test]
fn test_v2() {
    let env = Env::default();
    let contract_id = env.register_contract_wasm(None, i_like_big_budgets::WASM);
    let client = i_like_big_budgets::Client::new(&env, &contract_id);

    // env.budget().reset_limits(100000000, 41943040);
    env.budget().reset_unlimited();

    let hashes = client.run(&2_000);

    env.budget().print();
    // Cpu limit: 18446744073709551615; used: 636232861
    // Mem limit: 18446744073709551615; used: 50176306

    println!("{:?}", hashes.len());
}

// #[test]
// fn test_v2() {
//     let env = Env::default();
//     let contract_id = env.register_contract(None, Contract);
//     let client = ContractClient::new(&env, &contract_id);

//     env.budget().reset_limits(100000000, 41943040);

//     let hash = client.v2();

//     env.budget().print();
//     // Cpu limit: 18446744073709551615; used: 9131770
//     // Mem limit: 18446744073709551615; used: 12903884

//     println!("{:?}", hash);
// }

// #[test]
// fn test_v3() {
//     let env = Env::default();
//     let contract_id = env.register_contract(None, Contract);
//     let client = ContractClient::new(&env, &contract_id);

//     env.budget().reset_limits(100000000, 41943040);

//     let hash = client.v3();

//     env.budget().print();
//     // Cpu limit: 18446744073709551615; used: 292230
//     // Mem limit: 18446744073709551615; used: 6400

//     println!("{:?}", hash);
// }
