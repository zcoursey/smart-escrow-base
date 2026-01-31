const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

module.exports = buildModule("EscrowV2Module", (m) => {
    // Arguments for the constructor: (address _contractor, uint256 _escrowAmount)

    // We grab the second account to be the contractor (Account 1)
    // Account 0 is usually the deployer (Realtor)
    const contractor = m.getAccount(1);

    // 1.0 ETH
    const escrowAmount = ethers.parseEther("1.0");

    const escrow = m.contract("RealtorContractorEscrowTwoPartyV2", [contractor, escrowAmount]);

    return { escrow };
});
