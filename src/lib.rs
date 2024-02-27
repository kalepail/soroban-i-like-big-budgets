#![no_std]

use soroban_sdk::{contract, contractimpl, BytesN, Env, Map};

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn run(env: Env, count: u32) -> Map<BytesN<32>, u32> {
        let mut map = Map::new(&env);

        for i in 0..count {
            let key = env.crypto().sha256(&env.prng().gen_len(32));
            
            map.set(key.clone(), i);

            if i % 50 == 0 {
                env.storage().persistent().set(&key, &key.len());
            }
        }

        map
    }
}

mod test;
