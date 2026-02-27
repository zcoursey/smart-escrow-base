const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RealtorContractorEscrowTwoPartyV2", function () {
    let Escrow;
    let escrow;
    let realtor;
    let contractor;
    let otherAccount;
    const escrowAmount = ethers.parseEther("1.0");

    beforeEach(async function () {
        [realtor, contractor, otherAccount] = await ethers.getSigners();
        Escrow = await ethers.getContractFactory("RealtorContractorEscrowTwoPartyV2");
        escrow = await Escrow.deploy(
            realtor.address,
            escrowAmount,
            "Location",
            "Description"
        );
        await escrow.waitForDeployment();
    });

    describe("Deployment & Acceptance", function () {
        it("Should set the realtor but NOT the contractor initially", async function () {
            expect(await escrow.realtor()).to.equal(realtor.address);
            expect(await escrow.contractor()).to.equal(ethers.ZeroAddress);
        });

        it("Should allow a contractor to accept", async function () {
            await expect(escrow.connect(contractor).accept())
                .to.emit(escrow, "Accepted")
                .withArgs(contractor.address);

            expect(await escrow.contractor()).to.equal(contractor.address);
            expect(await escrow.status()).to.equal(1); // Accepted
        });

        it("Should NOT allow arbitrary users to accept if already accepted", async function () {
            await escrow.connect(contractor).accept();
            await expect(escrow.connect(otherAccount).accept())
                .to.be.revertedWith("Already has contractor");
        });

        it("Should NOT allow Realtor to accept", async function () {
            await expect(escrow.connect(realtor).accept())
                .to.be.revertedWith("Realtor cannot be contractor");
        });
    });

    describe("Funding", function () {
        it("Should FAIL to fund before acceptance", async function () {
            await expect(escrow.fund({ value: escrowAmount }))
                .to.be.revertedWith("Must be Accepted first");
        });

        it("Should allow funding AFTER acceptance", async function () {
            await escrow.connect(contractor).accept();

            await expect(escrow.fund({ value: escrowAmount }))
                .to.emit(escrow, "Funded")
                .withArgs(realtor.address, escrowAmount);

            expect(await escrow.status()).to.equal(2); // Funded
        });
    });

    describe("Standard Flow (Approve -> Withdraw)", function () {
        beforeEach(async function () {
            await escrow.connect(contractor).accept();
            await escrow.fund({ value: escrowAmount });
        });

        it("Should allow approval", async function () {
            await expect(escrow.approve())
                .to.emit(escrow, "Approved")
                .withArgs(realtor.address);
            expect(await escrow.status()).to.equal(3); // Approved
        });

        it("Should allow withdrawal after approval", async function () {
            await escrow.approve();

            const preBalance = await ethers.provider.getBalance(await escrow.getAddress());
            expect(preBalance).to.equal(escrowAmount);

            await expect(escrow.connect(contractor).withdraw())
                .to.emit(escrow, "Paid")
                .withArgs(contractor.address, escrowAmount);

            const postBalance = await ethers.provider.getBalance(await escrow.getAddress());
            expect(postBalance).to.equal(0);
            expect(await escrow.status()).to.equal(4); // Paid
        });
    });

    describe("Refunds & Disputes", function () {
        beforeEach(async function () {
            await escrow.connect(contractor).accept();
            await escrow.fund({ value: escrowAmount });
        });

        it("Should REVERT on direct refund call (must use dispute)", async function () {
            await expect(escrow.refund())
                .to.be.revertedWith("Use dispute resolution for refund");
        });

        it("Should allow opening a dispute", async function () {
            await expect(escrow.openDispute())
                .to.emit(escrow, "DisputeOpened");
            expect(await escrow.status()).to.equal(6); // Disputed
        });

        it("Should process refund via dispute resolution", async function () {
            await escrow.openDispute();

            // Realtor asks for refund
            await escrow.realtorAgreesToRefund();

            // Contractor agrees to refund
            // Using explicit balance check instead of changeEtherBalances
            const preBalance = await ethers.provider.getBalance(await escrow.getAddress());
            expect(preBalance).to.equal(escrowAmount);

            await expect(escrow.connect(contractor).agreeRefundRealtor())
                .to.emit(escrow, "Refunded")
                .withArgs(realtor.address, escrowAmount);

            const postBalance = await ethers.provider.getBalance(await escrow.getAddress());
            expect(postBalance).to.equal(0);
            expect(await escrow.status()).to.equal(5); // Refunded
        });

        it("Should process payment via dispute resolution", async function () {
            // Re-deploy for clean state since beforeEach funds it but we need fresh dispute
            // Actually beforeEach is fine, but we need to reset if previous test changed state?
            // Mocha runs beforeEach before EACH test, so state is fresh.

            await escrow.openDispute();

            // Realtor agrees to pay
            await escrow.agreePayContractor();

            // Assert balance still in contract (no premature payment)
            expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(escrowAmount);

            // Contractor agrees to pay (accept payment)
            await expect(escrow.connect(contractor).contractorAgreesToPay())
                .to.emit(escrow, "Paid")
                .withArgs(contractor.address, escrowAmount);

            // Assert balance is 0 and status Paid
            expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(0);
            expect(await escrow.status()).to.equal(4); // Paid
        });
    });
});
