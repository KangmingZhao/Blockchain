// =============================================================================
//                                  Config 
// =============================================================================

// sets up web3.js
if (typeof web3 !== 'undefined')  {
	web3 = new Web3(web3.currentProvider);
} else {
	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

// Default account is the first one
web3.eth.defaultAccount = web3.eth.accounts[0];
// Constant we use later
var GENESIS = '0x0000000000000000000000000000000000000000000000000000000000000000';

// This is the ABI for your contract (get it from Remix, in the 'Compile' tab)
// ============================================================
var abi = [
	{
		"constant": false,
		"inputs": [
			{
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			},
			{
				"internalType": "uint32",
				"name": "amount",
				"type": "uint32"
			},
			{
				"internalType": "address[]",
				"name": "path",
				"type": "address[]"
			},
			{
				"internalType": "uint32",
				"name": "min_on_cycle",
				"type": "uint32"
			}
		],
		"name": "add_IOU",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"internalType": "address",
				"name": "debtor",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "creditor",
				"type": "address"
			}
		],
		"name": "lookup",
		"outputs": [
			{
				"internalType": "uint32",
				"name": "ret",
				"type": "uint32"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
];

// ============================================================
abiDecoder.addABI(abi);
// call abiDecoder.decodeMethod to use this - see 'getAllFunctionCalls' for more

// Reads in the ABI
var BlockchainSplitwiseContractSpec = web3.eth.contract(abi);

// This is the address of the contract you want to connect to; copy this from Remix
var contractAddress = '0x5BaF7dA45Fe8852d081e6d80BB3817c6a87a8aeB'
//此处HASH通过REMIX复制后填入。按理说应该是每次编译完后的HASH都不一样，如果重新运行，需要重新填写。

var BlockchainSplitwise = BlockchainSplitwiseContractSpec.at(contractAddress)


// =============================================================================
//                            Functions To Implement 
// =============================================================================

// TODO: 在这里添加任何辅助函数！

// 通过提供的提取函数从区块链中的所有调用中检索信息。
// 提取函数将单个调用转换为多个值（列表）。
// early_stop_fn 被传递给 getAllFunctionCalls。
function getAllData(extractor_fn, early_stop_fn) {
    const results = new Set();
    const all_calls = getAllFunctionCalls(contractAddress, 'add_IOU', early_stop_fn);
    for (var i = 0; i < all_calls.length; i++) {
        const extracted_values = extractor_fn(all_calls[i]);
        for (var j = 0; j < extracted_values.length; j++) {
            results.add(extracted_values[j]);
        }
    }
    return Array.from(results);
}

// 通过调用 getCallData 返回所有债权人的列表。
// 提取函数从每个调用中提取债权人地址。
function get_creditors() {
    return getAllData((call) => {
        // call.args[0] 是债权人。
        return [call.args[0]];
    }, null);
}

// 返回给定用户的所有债权人的列表。
// 使用 get_creditors 获取所有债权人，并根据欠款金额进行过滤。
function get_user_creditors(user) {
    var creditors = []
    const all_creditors = get_creditors()
    for (var i = 0; i < all_creditors.length; i++) {
        const amountOwed = BlockchainSplitwise.lookup(user, all_creditors[i]).toNumber();
        if (amountOwed > 0) {
            creditors.push(all_creditors[i])
        }
    }
    return creditors;
}

// 返回沿给定路径的最小欠款金额。
// 遍历路径并查找每对债务人-债权人的欠款金额。
function get_min_path(path) {
    var minOwed = null;
    for (var i = 1; i < path.length; i++) {
        const debtor = path[i-1]
        const creditor = path[i];
        const amountOwed = BlockchainSplitwise.lookup(debtor, creditor).toNumber();
        if (minOwed == null || minOwed > amountOwed) {
            minOwed = amountOwed;
        }
    }
    return minOwed;
}

// TODO: 返回系统中所有用户（债务人或债权人）的列表。
// 可以返回：
//   - 所有曾经发送或接收过 IOU 的人的列表
// 或者
//   - 当前欠款或被欠款的所有人的列表
function getUsers() {
    return getAllData((call) => {
        return [call.from, call.args[0]]
    }, null);
}

// TODO: 获取指定用户欠款的总金额。
// 使用 getCreditors 获取所有债权人，并累加用户欠给每个债权人的金额。
function getTotalOwed(user) {
    var totalOwed = 0;
    const all_creditors = get_creditors();
    for (var i = 0; i < all_creditors.length; i++) {
        totalOwed += BlockchainSplitwise.lookup(user, all_creditors[i]).toNumber();
    }
    return totalOwed;
}

// TODO: 获取用户最后一次发送或接收 IOU 的时间，以秒为单位自1970年1月1日起。
// 如果找不到用户的任何活动，则返回 null。
// 提示：尝试查看 'getAllFunctionCalls' 的编写方式。如果愿意，可以进行修改。
function getLastActive(user) {
    const all_timestamps = getAllData((call) => {
        if (call.from == user || call.args[0] == user) {
            return [call.timestamp];
        }
        return [];
    }, (call) => {
        return call.from == user || call.args[0] == user;
    });
    return Math.max(all_timestamps);
}

// TODO: 向系统中添加一个 IOU。
// 传递给函数的参数包括欠款人（creditor）和欠款金额（amount）。
// 如果存在债务循环，通过执行路径上的最小欠款量来破坏闭环。
// 如果没有循环，直接添加 IOU。
function add_IOU(creditor, amount) {
    const debtor = web3.eth.defaultAccount;
    const path = doBFS(creditor, debtor, get_user_creditors);
    if (path != null) {
        const min_on_cycle = Math.min(get_min_path
		(path), amount);
        // 现在添加 IOU，让合同了解任何可能的循环。
        return BlockchainSplitwise.add_IOU(creditor, amount, path, min_on_cycle);
    }
    var x = BlockchainSplitwise.add_IOU(creditor, amount, [], /*min_on_cycle=*/0);
    return;
}

// =============================================================================
//                              Provided Functions 
// =============================================================================
// Reading and understanding these should help you implement the above

// This searches the block history for all calls to 'functionName' (string) on the 'addressOfContract' (string) contract
// It returns an array of objects, one for each call, containing the sender ('from'), arguments ('args')
// and timestamp (unix micros) of block collation ('timestamp').
// Stops retrieving function calls as soon as the earlyStopFn is found. earlyStop takes
// as input a candidate function call and must return a truth value.
// The chain is processed from head to genesis block.
function getAllFunctionCalls(addressOfContract, functionName, earlyStopFn) {
	var curBlock = web3.eth.blockNumber;
	var function_calls = [];
	while (curBlock !== GENESIS) {
	  var b = web3.eth.getBlock(curBlock, true);
	  var txns = b.transactions;
	  for (var j = 0; j < txns.length; j++) {
	  	var txn = txns[j];
	  	// check that destination of txn is our contract
	  	if (txn.to === addressOfContract.toLowerCase()) {
	  		var func_call = abiDecoder.decodeMethod(txn.input);
	  		// check that the function getting called in this txn is 'functionName'
	  		if (func_call && func_call.name === functionName) {
	  			var args = func_call.params.map(function (x) {return x.value});
	  			function_calls.push({
	  				from: txn.from,
	  				args: args,
	  				timestamp: b.timestamp,
	  			})
	  			if (earlyStopFn &&
	  					earlyStopFn(function_calls[function_calls.length-1])) {
	  				return function_calls;
	  			}
	  		}
	  	}
	  }
	  curBlock = b.parentHash;
	}
	return function_calls;
}

// We've provided a breadth-first search implementation for you, if that's useful
// It will find a path from start to end (or return null if none exists)
// You just need to pass in a function ('getNeighbors') that takes a node (string) and returns its neighbors (as an array)
function doBFS(start, end, getNeighbors) {
	var queue = [[start]];
	while (queue.length > 0) {
		var cur = queue.shift();
		var lastNode = cur[cur.length-1]
		if (lastNode === end) {
			return cur;
		} else {
			var neighbors = getNeighbors(lastNode);
			for (var i = 0; i < neighbors.length; i++) {
				queue.push(cur.concat([neighbors[i]]));
			}
		}
	}
	return null;
}
// =============================================================================
//                                      UI 
// =============================================================================

// This code updates the 'My Account' UI with the results of your functions
$("#total_owed").html("$"+getTotalOwed(web3.eth.defaultAccount));
$("#last_active").html(timeConverter(getLastActive(web3.eth.defaultAccount)));
$("#myaccount").change(function() {
	web3.eth.defaultAccount = $(this).val();
	$("#total_owed").html("$"+getTotalOwed(web3.eth.defaultAccount));
	$("#last_active").html(timeConverter(getLastActive(web3.eth.defaultAccount)))
});

// Allows switching between accounts in 'My Account' and the 'fast-copy' in 'Address of person you owe
var opts = web3.eth.accounts.map(function (a) { return '<option value="'+a+'">'+a+'</option>' })
$(".account").html(opts);
$(".wallet_addresses").html(web3.eth.accounts.map(function (a) { return '<li>'+a+'</li>' }))

// This code updates the 'Users' list in the UI with the results of your function
$("#all_users").html(getUsers().map(function (u,i) { return "<li>"+u+"</li>" }));

// This runs the 'add_IOU' function when you click the button
// It passes the values from the two inputs above
$("#addiou").click(function() {
  add_IOU($("#creditor").val(), $("#amount").val());
  window.location.reload(false); // refreshes the page after
});

// This is a log function, provided if you want to display things to the page instead of the JavaScript console
// Pass in a discription of what you're printing, and then the object to print
function log(description, obj) {
	$("#log").html($("#log").html() + description + ": " + JSON.stringify(obj, null, 2) + "\n\n");
}


