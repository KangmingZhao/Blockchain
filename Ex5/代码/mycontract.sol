// Please paste your contract's solidity code here
// Note that writing a contract here WILL NOT deploy it and allow you to access it from your client
// You should write and develop your contract in Remix and then, before submitting, copy and paste it here
// SPDX-License-Identifier: SimPL-2.0
// Please paste your contract's solidity code here
// You should write and develop your contract in Remix and then, before submitting, copy and paste it here
pragma solidity >=0.4.22 <0.6.0;
contract BlockchainSplitwise {
    //定义结构体，存储欠债金额
    struct Debt {
        uint32 amount;
    }
    //创建保存欠债关系的映射all_debts
    mapping(address=>mapping(address=>Debt)) internal all_debts;
    function make_path(address start, address end, address[] memory path, uint32 min_on_cycle) private returns (bool ret) {
        if (start != path[0] || end != path[path.length - 1]) {
            return false;
        }
        // Maximu路径大小为10，不包括开始和结束。
        if (path.length > 12) {
            return false;
        }
        for (uint i = 1; i < path.length; i++) {
            Debt storage iou = all_debts[path[i-1]][path[i]];
             // 如果欠债路径上某个两个用户之间不存在欠债关系，或者二者欠债金额小于min_on_cycle,路径更改失败
            if (iou.amount == 0 || iou.amount < min_on_cycle) {
                return false;
            }
            // 否则，进行路径更改，循环上每对欠债金额都减去min_on_cycle
            else {
                iou.amount -= min_on_cycle;
            }
        }
        return true;
    }
    
    // 溢出检查
    function make_sure(uint32 ac, uint32 bc) internal pure returns (uint32) {
      uint32 xc = ac + bc;
      require(xc >= ac);
      return xc;
    }
    
    
    // 查找债务人欠债权人的债务总额.
    function lookup(address debtor, address creditor) public view returns (uint32 ret) {
        ret = all_debts[debtor][creditor].amount;
    }
    
    
    function add_IOU(address creditor, uint32 amount,  address[] memory path, uint32 min_on_cycle) public {
        address debtor = msg.sender;
        
        require(debtor != creditor, "Creditor cannot be creditor.");
        
        Debt storage iou = all_debts[debtor][creditor];  // assigns a reference
        
        // 如果min_on_cycle等于0，说明之前的负债关系不构成闭环，直接加上amount即可
        if (min_on_cycle == 0) {
            iou.amount = make_sure(iou.amount, amount);
            return;
        }
        // 验证min_on_cycle始终是直接欠下的金额（因为这是循环欠款的末端）
        require(min_on_cycle <= (iou.amount + amount), "min_on_cycle cannot be nore than amount");
        // 遍历路径，消灭闭环
        require(make_path(creditor, debtor, path, min_on_cycle), "The path is invalid");
        // 此时添加amount不会产生闭环，直接添加amount
        iou.amount = make_sure(iou.amount, (amount - min_on_cycle));
    }
}