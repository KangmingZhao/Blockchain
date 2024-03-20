from sys import exit
from bitcoin.core.script import *

from utils import *
from config import my_private_key, my_public_key, my_address, faucet_address
from ex1 import send_from_P2PKH_transaction


######################################################################
# TODO: Complete the scriptPubKey implementation for Exercise 3
ex3a_txout_scriptPubKey = [
    OP_2DUP, ## 从栈顶弹出两个数x y
    OP_ADD,## x+y
    211,
    OP_EQUALVERIFY, ## 判断x+y是否等于211，若相等则继续执行脚本，若不相等则中断脚本执行
    OP_SUB,## x-y
    937,
    OP_EQUAL ##判断x-y是否等于937 由于学号后四位为0937 故此处选取937.此处不管是否相等均会继续执行脚本
]
######################################################################

if __name__ == '__main__':
    ######################################################################
    # TODO: set these parameters correctly
    amount_to_send = 0.00177492-0.0001 ##减去交易费
    txid_to_spend = (
        'f941016fbcc1a906341213761a7ed84ec548031cd47f1eb9750afbff14b3c678')
    utxo_index = 7
    ######################################################################

    response = send_from_P2PKH_transaction(
        amount_to_send, txid_to_spend, utxo_index,
        ex3a_txout_scriptPubKey)
    print(response.status_code, response.reason)
    print(response.text)
