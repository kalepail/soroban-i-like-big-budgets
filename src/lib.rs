#![no_std]

use soroban_sdk::{contract, contractimpl, Env, Map, Vec};

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn run(env: Env, iters: u32) {
        let mut keys_map = Map::new(&env);
        let mut keys_vec = Vec::new(&env);
        let mut count = 0;

        for i in 0..iters {
            let key = env.crypto().sha256(&env.prng().gen_len(32));
                
            keys_map.clone().set(key.clone(), i);
            keys_vec.clone().push_back(key.clone());
        
            if i % 100 == 0 {
                env.events().publish((count.clone(), ), keys_map.clone());
                env.storage().persistent().set(&count.clone(), &(keys_map.clone(), keys_vec.clone()));
                keys_map = Map::new(&env);
                keys_vec = Vec::new(&env);
                count += 1;
            }
        }
    }
}

/* TODO 
hit CPU
hit memory
hit storage writes
hit return value via emitted events
*/ 

mod test;
