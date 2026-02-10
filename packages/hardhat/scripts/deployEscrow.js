import hre from "hardhat";

async function main() {
  const [realtor] = await hre.ethers.getSigners();

  // TODO: replace these with args you want
  const contractor = "0xCONTRACTOR_ADDRESS_HERE";
  const escrowAmountWei = hre.ethers.parseEther("0.01"); // example

  const Escrow = await hre.ethers.getContractFactory("RealtorContractorEscrowTwoPartyV2");
  const escrow = await Escrow.deploy(contractor, escrowAmountWei);

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log("Realtor:", realtor.address);
  console.log("Escrow deployed to:", address);
  console.log("Contractor:", contractor);
  console.log("Escrow amount (wei):", escrowAmountWei.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
