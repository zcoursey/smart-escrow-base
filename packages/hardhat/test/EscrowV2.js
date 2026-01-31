const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RealtorContractorEscrowTwoParty (EscrowV2)", function () {
    let Escrow;
    let escrow;
    let realtor;
    let contractor;
    let otherAccount;
    const escrowAmount = ethers.parseEther("1.0");

    // "beforeEach" runs one time before EVERY test.
    beforeEach(async function () {
        [realtor, contractor, otherAccount] = await ethers.getSigners();
        Escrow = await ethers.getContractFactory("RealtorContractorEscrowTwoPartyV2");
        escrow = await Escrow.deploy(contractor.address, escrowAmount);
        await escrow.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right realtor and contractor", async function () {
            expect(await escrow.realtor()).to.equal(realtor.address);
            expect(await escrow.contractor()).to.equal(contractor.address);
        });

        it("Should set the right escrow amount", async function () {
            expect(await escrow.escrowAmount()).to.equal(escrowAmount);
        });

        it("Should start in Created (0) status", async function () {
            expect(await escrow.status()).to.equal(0);
        });
    });

    describe("Standard Flow (Fund -> Approve -> Withdraw)", function () {
        it("Should allow realtor to fund", async function () {
            await expect(escrow.fund({ value: escrowAmount }))
                .to.emit(escrow, "Funded")
                .withArgs(realtor.address, escrowAmount);

            expect(await escrow.status()).to.equal(1); // Funded
            expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(escrowAmount);
        });

        it("Should not allow funding with incorrect amount", async function () {
            await expect(escrow.fund({ value: ethers.parseEther("0.5") }))
                .to.revertedWith("Must send exact amount");
        });

        it("Should allow realtor to approve after funding", async function () {
            await escrow.fund({ value: escrowAmount });

            await expect(escrow.approve())
                .to.emit(escrow, "Approved")
                .withArgs(realtor.address);

            expect(await escrow.status()).to.equal(2); // Approved
        });

        it("Should allow contractor to withdraw after approval", async function () {
            await escrow.fund({ value: escrowAmount });
            await escrow.approve();

            const startBalance = await ethers.provider.getBalance(contractor.address);
            await expect(escrow.connect(contractor).withdraw())
                .to.emit(escrow, "Paid")
                .withArgs(contractor.address, escrowAmount);

            expect(await escrow.status()).to.equal(3); // Paid

            const endBalance = await ethers.provider.getBalance(contractor.address);
            // Verify balance increased (approximate due to gas)
            expect(endBalance).to.be.gt(startBalance);
        });
    });

    describe("Realtor Refund Flow", function () {
        it("Should allow realtor to refund before approval", async function () {
            await escrow.fund({ value: escrowAmount });

            const startBalance = await ethers.provider.getBalance(realtor.address);

            await expect(escrow.refund())
                .to.emit(escrow, "Refunded")
                .withArgs(realtor.address, escrowAmount);

            expect(await escrow.status()).to.equal(4); // Refunded

            const endBalance = await ethers.provider.getBalance(realtor.address);
            // Roughly check money came back (minus gas)
            expect(endBalance).to.be.closeTo(startBalance + escrowAmount, ethers.parseEther("0.01"));
        });

        it("Should FAIL to refund after approval", async function () {
            await escrow.fund({ value: escrowAmount });
            await escrow.approve();

            await expect(escrow.refund()).to.be.revertedWith("Can only refund when funded and not approved");
        });
    });

    describe("Dispute Flow", function () {
        beforeEach(async function () {
            // Get to a state where dispute is possible (Funded)
            await escrow.fund({ value: escrowAmount });
        });

        it("Should allow parties to open a dispute", async function () {
            await expect(escrow.openDispute())
                .to.emit(escrow, "DisputeOpened");

            expect(await escrow.status()).to.equal(5); // Disputed
        });

        it("Should resolve to Pay Contractor when both agree", async function () {
            await escrow.openDispute();

            await escrow.agreePayContractor(); // Realtor votes
            await expect(escrow.connect(contractor).agreePayContractor()) // Contractor votes
                .to.emit(escrow, "Paid")
                .withArgs(contractor.address, escrowAmount);

            expect(await escrow.status()).to.equal(3); // Paid
        });

        it("Should resolve to Refund Realtor when both agree", async function () {
            await escrow.openDispute();

            await escrow.agreeRefundRealtor();
            await expect(escrow.connect(contractor).agreeRefundRealtor())
                .to.emit(escrow, "Refunded")
                .withArgs(realtor.address, escrowAmount);

            expect(await escrow.status()).to.equal(4); // Refunded
        });

        it("Should allow Timeout Refund if time passes", async function () {
            await escrow.openDispute();

            // TIME TRAVEL! 
            // We tell the blockchain to fast-forward 7 days + 1 second
            // Note: "evm_increaseTime" uses an underscore because it is a low-level command sent directly to the Ethereum Node.
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine"); // Mine a new block to save the time change

            // Now the realtor can claim the money back alone
            await expect(escrow.refundAfterDisputeTimeout())
                .to.emit(escrow, "DisputeTimeoutRefund")
                .withArgs(realtor.address, escrowAmount);

            expect(await escrow.status()).to.equal(4); // Refunded
        });

        it("Should NOT allow Timeout Refund before time passes", async function () {
            await escrow.openDispute();

            // Only 1 day passes
            await ethers.provider.send("evm_increaseTime", [1 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            await expect(escrow.refundAfterDisputeTimeout())
                .to.revertedWith("Timeout not reached");
        });
    });
});
