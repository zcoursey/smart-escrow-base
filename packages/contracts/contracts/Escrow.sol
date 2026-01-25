//SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

/*
    Two-Party Escrow: Realtor <-> Contractor

    Roles:
    - realtor  = payer + approver
    - contractor = gets paid

    Status:
    0 = Created
    1 = Funded
    2 = Approved
    3 = Paid (closed)
    4 = Refunded (closed)
*/

contract RealtorContractorEscrowTwoParty {
    address public immutable realtor; // Funds + approves
    address public immutable contractor; // Gets paid
    uint256 public immutable escrowAmount;

    uint8 public status;

    // declare the events here and emit them in the functions
    event Funded(address indexed realtor, uint256 amount);
    event Approved(address indexed realtor);
    event Paid(address indexed contractor, uint256 amount);
    event Refunded(address indexed realtor, uint256 amount);

    //Modifiers, we declare the modifiers here and use them in the functions as a condition
    modifier onlyRealtor() {
        require(msg.sender == realtor, "Only realtor"); //Require is going to check the condition if not it will send the text
        _; //This is going to execute the function
    }

    modifier onlyContractor() {
        require(msg.sender == contractor, "Only contractor");
        _;
    }

    constructor(address _contractor, uint256 _escrowAmount) {
        require(_contractor != address(0), "Bad contractor");
        require(_escrowAmount > 0, "Bad amount");

        realtor = msg.sender; // Whoever deploys is the Realtor
        contractor = _contractor;
        escrowAmount = _escrowAmount;
        // status defaults to 0
    }

    // Realtor funds escrow
    function fund() external payable onlyRealtor {
        require(status == 0, "Already funded or active");
        require(msg.value == escrowAmount, "Must send exact amount");

        status = 1;
        emit Funded(msg.sender, msg.value);
    }

    // Realtor approves completion (since only 2 parties)
    function approve() external onlyRealtor {
        require(status == 1, "Not funded");
        status = 2;
        emit Approved(msg.sender);
    }

    // Contractor withdraws after approval
    function withdraw() external onlyContractor {
        require(status == 2, "Not approved");

        status = 3; // set before transfer (reentrancy protection)
        uint256 amount = address(this).balance;

        (bool ok, ) = contractor.call{value: amount}(""); //Ok is a boolean value that indicates whether the call was successful or not.
        require(ok, "Transfer failed");

        emit Paid(contractor, amount);
    }

    // Realtor can cancel BEFORE approval
    function refund() external onlyRealtor {
        require(status == 1, "Can only refund when funded and not approved");

        status = 4;
        uint256 amount = address(this).balance;

        (bool ok, ) = realtor.call{value: amount}("");
        require(ok, "Refund failed");

        emit Refunded(realtor, amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
