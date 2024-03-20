from sys import exit
from bitcoin.core.script import *
from bitcoin.wallet import CBitcoinAddress, CBitcoinSecret, P2PKHBitcoinAddress
from utils import *
from config import my_private_key, my_public_key, my_address, faucet_address
from ex1 import send_from_P2PKH_transaction

##三位客户私钥
cust1_private_key = CBitcoinSecret(
    'cP3NobfWvH8TZjUgPxtBVPKJb28tKvULY6C3cktLsjbaPT8XAhLX')
cust1_public_key = cust1_private_key.pub
cust2_private_key = CBitcoinSecret(
    'cNcM97bi2BTw1Zwaa89HrrzoJKYA5QjLMfqEB8R5DRDCjwrtmhU1')
cust2_public_key = cust2_private_key.pub
cust3_private_key = CBitcoinSecret(
    'cUKoVsMq1LLtpQcTiyfuHutJM3gqZxAPBRikTNp28d518RkLYH8e')
cust3_public_key = cust3_private_key.pub


######################################################################
# TODO: Complete the scriptPubKey implementation for Exercise 2

# You can assume the role of the bank for the purposes of this problem
# and use my_public_key and my_private_key in lieu of bank_public_key and
# bank_private_key.

ex2a_txout_scriptPubKey = [ 
    my_public_key,
    OP_CHECKSIGVERIFY,  #验证是否是公钥持有者
    OP_1, #至少一个签名才能解锁比特币
    cust1_public_key,
    cust2_public_key,
    cust3_public_key,
    OP_3, #至少三个签名才能解锁比特币
    OP_CHECKMULTISIG#验证多个签名是否满足条件
]
######################################################################

if __name__ == '__main__':
    ######################################################################
    # TODO: set these parameters correctly
    amount_to_send = 0.000167492 
    txid_to_spend = (
        'f941016fbcc1a906341213761a7ed84ec548031cd47f1eb9750afbff14b3c678')
    utxo_index = 6
    ######################################################################

    response = send_from_P2PKH_transaction(
        amount_to_send, txid_to_spend, utxo_index,
        ex2a_txout_scriptPubKey)
    print(response.status_code, response.reason)
    print(response.text)
