const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("EscrowFactoryModule", (m) => {
    const factory = m.contract("EscrowFactory");

    return { factory };
});
