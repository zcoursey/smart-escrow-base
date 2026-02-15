// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import "./escrowV2.sol";

contract EscrowFactory {
    address[] public deployedEscrows;

    event EscrowCreated(
        address indexed escrowAddress,
        address indexed realtor,
        address indexed contractor,
        uint256 amount,
        string workLocation,
        string description
    );

    function createEscrow(
        uint256 amount,
        string memory workLocation,
        string memory description
    ) external {
        // Create new Escrow
        // msg.sender is passed as the 'realtor'
        // Contractor is not passed, defaults to address(0) inside EscrowV2
        RealtorContractorEscrowTwoPartyV2 newEscrow = new RealtorContractorEscrowTwoPartyV2(
                msg.sender,
                amount,
                workLocation,
                description
            );

        deployedEscrows.push(address(newEscrow));

        emit EscrowCreated(
            address(newEscrow),
            msg.sender,
            address(0), // Contractor is initially 0
            amount,
            workLocation,
            description
        );
    }

    function getEscrows() external view returns (address[] memory) {
        return deployedEscrows;
    }
}
