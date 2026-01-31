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
    5 = Disputed (frozen)
*/

contract RealtorContractorEscrowTwoPartyV2 {
    address public immutable realtor; // Funds + approves
    address public immutable contractor; // Gets paid
    uint256 public immutable escrowAmount;

    uint8 public status;

    // Dispute data
    uint256 public disputeOpenedAt;
    uint256 public constant DISPUTE_TIMEOUT = 7 days;

    bool public realtorAgreesPay;
    bool public contractorAgreesPay;
    bool public realtorAgreesRefund;
    bool public contractorAgreesRefund;

    // Events
    event Funded(address indexed realtor, uint256 amount);
    event Approved(address indexed realtor);
    event Paid(address indexed contractor, uint256 amount);
    event Refunded(address indexed realtor, uint256 amount);

    event DisputeOpened(address indexed openedBy, uint256 openedAt);
    event DisputeVote(address indexed voter, bool pay, bool refund);
    event DisputeTimeoutRefund(address indexed realtor, uint256 amount);

    // Modifiers
    modifier onlyRealtor() {
        require(msg.sender == realtor, "Only realtor");
        _;
    }

    modifier onlyContractor() {
        require(msg.sender == contractor, "Only contractor");
        _;
    }

    modifier onlyParty() {
        require(
            msg.sender == realtor || msg.sender == contractor,
            "Only parties"
        );
        _;
    }

    constructor(address _contractor, uint256 _escrowAmount) {
        require(_contractor != address(0), "Bad contractor");
        require(_escrowAmount > 0, "Bad amount");

        realtor = msg.sender;
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

    // Realtor approves completion
    function approve() external onlyRealtor {
        require(status == 1, "Not funded");
        status = 2;
        emit Approved(msg.sender);
    }

    // Either party can open a dispute while active (Funded or Approved)
    function openDispute() external onlyParty {
        require(status == 1 || status == 2, "Not disputable");

        status = 5;
        disputeOpenedAt = block.timestamp;

        // reset votes (in case you ever extend/modify flows later)
        realtorAgreesPay = false;
        contractorAgreesPay = false;
        realtorAgreesRefund = false;
        contractorAgreesRefund = false;

        emit DisputeOpened(msg.sender, disputeOpenedAt);
    }

    // Parties vote to PAY contractor (requires both to match)
    function agreePayContractor() external onlyParty {
        require(status == 5, "Not disputed");

        if (msg.sender == realtor) realtorAgreesPay = true;
        else contractorAgreesPay = true;

        emit DisputeVote(msg.sender, true, false);

        if (realtorAgreesPay && contractorAgreesPay) {
            _payoutContractor();
        }
    }

    // Parties vote to REFUND realtor (requires both to match)
    function agreeRefundRealtor() external onlyParty {
        require(status == 5, "Not disputed");

        if (msg.sender == realtor) realtorAgreesRefund = true;
        else contractorAgreesRefund = true;

        emit DisputeVote(msg.sender, false, true);

        if (realtorAgreesRefund && contractorAgreesRefund) {
            _refundRealtor();
        }
    }

    // Timeout escape hatch: if dispute drags on, allow refund to realtor (payer protection)
    function refundAfterDisputeTimeout() external onlyRealtor {
        require(status == 5, "Not disputed");
        require(
            block.timestamp >= disputeOpenedAt + DISPUTE_TIMEOUT,
            "Timeout not reached"
        );

        uint256 amount = address(this).balance;

        status = 4; // closed
        (bool ok, ) = realtor.call{value: amount}("");
        require(ok, "Refund failed");

        emit DisputeTimeoutRefund(realtor, amount);
        emit Refunded(realtor, amount);
    }

    // Contractor withdraws after approval (blocked if disputed)
    function withdraw() external onlyContractor {
        require(status == 2, "Not approved");

        status = 3; // set before transfer (reentrancy protection)
        uint256 amount = address(this).balance;

        (bool ok, ) = contractor.call{value: amount}("");
        require(ok, "Transfer failed");

        emit Paid(contractor, amount);
    }

    // Realtor can cancel BEFORE approval (blocked if disputed)
    function refund() external onlyRealtor {
        require(status == 1, "Can only refund when funded and not approved");

        status = 4;
        uint256 amount = address(this).balance;

        (bool ok, ) = realtor.call{value: amount}("");
        require(ok, "Refund failed");

        emit Refunded(realtor, amount);
    }

    // Internal helpers (keep external functions clean)
    function _payoutContractor() internal {
        // only valid while disputed (called after both agree)
        require(status == 5, "Not disputed");

        status = 3; // closed
        uint256 amount = address(this).balance;

        (bool ok, ) = contractor.call{value: amount}("");
        require(ok, "Transfer failed");

        emit Paid(contractor, amount);
    }

    function _refundRealtor() internal {
        require(status == 5, "Not disputed");

        status = 4; // closed
        uint256 amount = address(this).balance;

        (bool ok, ) = realtor.call{value: amount}("");
        require(ok, "Refund failed");

        emit Refunded(realtor, amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
