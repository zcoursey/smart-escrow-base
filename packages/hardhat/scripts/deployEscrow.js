import hre from "hardhat";

async function main() {
  const [realtor] = await hre.ethers.getSigners();

  // CHANGE THIS to your contractor wallet address (MetaMask address)
  const contractor = "0xCONTRACTOR_ADDRESS";

  // set escrow amount (must match fund() msg.value exactly)
  const escrowAmountWei = hre.ethers.parseEther("0.01");

  const Escrow = await hre.ethers.getContractFactory("RealtorContractorEscrowTwoPartyV2");
  const escrow = await Escrow.deploy(contractor, escrowAmountWei);
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  const net = await hre.ethers.provider.getNetwork();

  console.log("chainId:", net.chainId.toString());
  console.log("realtor:", realtor.address);
  console.log("contractor:", contractor);
  console.log("escrowAmountWei:", escrowAmountWei.toString());
  console.log("contractAddress:", address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
