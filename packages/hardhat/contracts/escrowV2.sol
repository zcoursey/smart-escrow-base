// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

contract RealtorContractorEscrowTwoPartyV2 {
    event Funded(address indexed realtor, uint256 amount);
    event Accepted(address indexed contractor);
    event Approved(address indexed realtor);
    event Paid(address indexed contractor, uint256 amount);
    event Refunded(address indexed realtor, uint256 amount);
    event DisputeOpened(address indexed openedBy, uint256 openedAt);
    event DisputeVote(address indexed voter, bool pay, bool refund);
    event DisputeTimeoutRefund(address indexed realtor, uint256 amount);

    enum Status {
        Created,
        Accepted,
        Funded,
        Approved,
        Paid,
        Refunded,
        Disputed
    }

    address public immutable realtor;
    address public contractor; // Not immutable, set later via accept()
    uint256 public immutable escrowAmount;
    string public workLocation;
    string public description;

    Status public status;
    uint256 public disputeOpenedAt;

    // Votes for dispute resolution
    bool public realtorAgreesPay;
    bool public realtorAgreesRefund;
    bool public contractorAgreesPay;
    bool public contractorAgreesRefund;

    uint256 public constant DISPUTE_TIMEOUT = 7 days;

    constructor(
        address _realtor,
        // _contractor removed
        uint256 _escrowAmount,
        string memory _workLocation,
        string memory _description
    ) {
        require(_realtor != address(0), "Bad realtor");
        require(_escrowAmount > 0, "Bad amount");

        realtor = _realtor;
        contractor = address(0); // Explicitly set to 0 (default)
        escrowAmount = _escrowAmount;
        workLocation = _workLocation;
        description = _description;
        status = Status.Created;
    }

    modifier onlyRealtor() {
        require(msg.sender == realtor, "Only realtor");
        _;
    }

    modifier onlyContractor() {
        require(msg.sender == contractor, "Only contractor");
        require(contractor != address(0), "No contractor yet");
        _;
    }

    modifier onlyParty() {
        require(
            msg.sender == realtor || msg.sender == contractor,
            "Only party"
        );
        _;
    }

    modifier inStatus(Status _status) {
        require(status == _status, "Invalid status");
        _;
    }

    // --- New Flow Functions ---

    function accept() external {
        require(contractor == address(0), "Already has contractor");
        require(msg.sender != realtor, "Realtor cannot be contractor");
        require(status == Status.Created, "Invalid status for accept");

        contractor = msg.sender;
        status = Status.Accepted;

        emit Accepted(msg.sender);
    }

    function fund() external payable onlyRealtor {
        require(status == Status.Accepted, "Must be Accepted first");
        require(contractor != address(0), "No contractor to fund");
        require(msg.value == escrowAmount, "Wrong amount");

        status = Status.Funded;
        emit Funded(msg.sender, msg.value);
    }

    // --- Existing Functionality ---

    function approve() external onlyRealtor inStatus(Status.Funded) {
        status = Status.Approved;
        emit Approved(msg.sender);
    }

    function withdraw() external onlyContractor inStatus(Status.Approved) {
        status = Status.Paid;
        uint256 balance = address(this).balance;
        emit Paid(contractor, balance);
        (bool success, ) = payable(contractor).call{value: balance}("");
        require(success, "Transfer failed");
    }

    function refund() external view onlyRealtor inStatus(Status.Funded) {
        revert("Use dispute resolution for refund");
    }

    function openDispute() external onlyParty {
        require(
            status == Status.Funded || status == Status.Approved,
            "Cannot dispute now"
        );
        status = Status.Disputed;
        disputeOpenedAt = block.timestamp;
        emit DisputeOpened(msg.sender, disputeOpenedAt);
    }

    function agreePayContractor()
        external
        onlyRealtor
        inStatus(Status.Disputed)
    {
        realtorAgreesPay = true;
        emit DisputeVote(msg.sender, true, false);
        _checkDisputeResolution();
    }

    function agreeRefundRealtor()
        external
        onlyContractor
        inStatus(Status.Disputed)
    {
        contractorAgreesRefund = true;
        emit DisputeVote(msg.sender, false, true);
        _checkDisputeResolution();
    }

    function contractorAgreesToPay()
        external
        onlyContractor
        inStatus(Status.Disputed)
    {
        contractorAgreesPay = true;
        emit DisputeVote(msg.sender, true, false);
        _checkDisputeResolution();
    }

    function realtorAgreesToRefund()
        external
        onlyRealtor
        inStatus(Status.Disputed)
    {
        realtorAgreesRefund = true;
        emit DisputeVote(msg.sender, false, true);
        _checkDisputeResolution();
    }

    function _checkDisputeResolution() internal {
        uint256 balance = address(this).balance;

        if (realtorAgreesPay && contractorAgreesPay) {
            status = Status.Paid;
            emit Paid(contractor, balance);
            (bool success, ) = payable(contractor).call{value: balance}("");
            require(success, "Transfer failed");
        } else if (contractorAgreesRefund && realtorAgreesRefund) {
            status = Status.Refunded;
            emit Refunded(realtor, balance);
            (bool success, ) = payable(realtor).call{value: balance}("");
            require(success, "Transfer failed");
        }
    }

    function refundAfterDisputeTimeout() external {
        require(status == Status.Disputed, "Not disputed");
        require(
            block.timestamp >= disputeOpenedAt + DISPUTE_TIMEOUT,
            "Timeout not reached"
        );
        status = Status.Refunded;
        uint256 balance = address(this).balance;
        emit DisputeTimeoutRefund(realtor, balance);
        (bool success, ) = payable(realtor).call{value: balance}("");
        require(success, "Transfer failed");
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
