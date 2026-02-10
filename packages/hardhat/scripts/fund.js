import hre from "hardhat";
import { logEvent } from "./_log.js";

const CONTRACT = "0xYOUR_CONTRACT_ADDRESS";

async function main() {
  const [realtor] = await hre.ethers.getSigners();

  const escrow = await hre.ethers.getContractAt(
    "RealtorContractorEscrowTwoPartyV2",
    CONTRACT
  );

  const amount = await escrow.escrowAmount();

  const tx = await escrow.fund({ value: amount });
  const receipt = await tx.wait();

  console.log("Funded tx:", receipt.hash);

  const logged = await logEvent(CONTRACT, {
    event_name: "Funded",
    tx_hash: receipt.hash,
    actor_address: realtor.address,
    payload: { amount_wei: amount.toString() },
  });

  console.log("Logged:", logged);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
