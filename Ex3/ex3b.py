from sys import exit
from bitcoin.core.script import *

from utils import *
from config import my_private_key, my_public_key, my_address, faucet_address
from ex1 import P2PKH_scriptPubKey
from ex3a import ex3a_txout_scriptPubKey


######################################################################
# TODO: set these parameters correctly
amount_to_send = 0.001674920-0.001 ## 减去交易费用
txid_to_spend = '0e796729f36662a5e70edaf4f1c5c9bdef60c5cc5874dda84dbbd49fcab3a987'
utxo_index = 0
######################################################################

txin_scriptPubKey = ex3a_txout_scriptPubKey
######################################################################
# TODO: implement the scriptSig for redeeming the transaction created
# in  Exercise 3a.
txin_scriptSig = [574,
                  -363]
######################################################################
txout_scriptPubKey = P2PKH_scriptPubKey(faucet_address)

response = send_from_custom_transaction(
    amount_to_send, txid_to_spend, utxo_index,
    txin_scriptPubKey, txin_scriptSig, txout_scriptPubKey)
print(response.status_code, response.reason)
print(response.text)
