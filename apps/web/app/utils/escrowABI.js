export const escrowABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "_contractor", "type": "address" },
            { "internalType": "uint256", "name": "_escrowAmount", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [{ "indexed": true, "internalType": "address", "name": "realtor", "type": "address" }],
        "name": "Approved",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "openedBy", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "openedAt", "type": "uint256" }
        ],
        "name": "DisputeOpened",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "realtor", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "DisputeTimeoutRefund",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "voter", "type": "address" },
            { "indexed": false, "internalType": "bool", "name": "pay", "type": "bool" },
            { "indexed": false, "internalType": "bool", "name": "refund", "type": "bool" }
        ],
        "name": "DisputeVote",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "realtor", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "Funded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "contractor", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "Paid",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "realtor", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "Refunded",
        "type": "event"
    },
    { "inputs": [], "name": "DISPUTE_TIMEOUT", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "agreePayContractor", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "agreeRefundRealtor", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "contractor", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "contractorAgreesPay", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "contractorAgreesRefund", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "disputeOpenedAt", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "escrowAmount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "fund", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [], "name": "getBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "openDispute", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "realtor", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "realtorAgreesPay", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "realtorAgreesRefund", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "refund", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "refundAfterDisputeTimeout", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "status", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];
