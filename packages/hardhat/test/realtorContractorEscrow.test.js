const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RealtorContractorEscrowTwoParty", function () {
    let contract;
    let realtor;
    let contractor;

    // We use 1 ETH for the escrow amount in tests
    const escrowAmount = ethers.parseEther("1"); // v6

    beforeEach(async () => {
        // specific accounts for realtor and contractor
        [realtor, contractor] = await ethers.getSigners();

        // Get the contract factory hooked up to the realtor signer
        const Escrow = await ethers.getContractFactory(
            "RealtorContractorEscrowTwoParty",
            realtor
        );

        // Deploy the contract with the contractor's address and the amount
        contract = await Escrow.deploy(contractor.address, escrowAmount);
        await contract.waitForDeployment(); // v6
    });

    describe("Deployment", () => {
        // Test that the immutable variables are set correctly
        it("should set the correct realtor and contractor", async () => {
            expect(await contract.realtor()).to.equal(realtor.address);
            expect(await contract.contractor()).to.equal(contractor.address);
        });

        // Test that the escrow amount is stored correctly
        it("should set the correct escrow amount", async () => {
            expect(await contract.escrowAmount()).to.equal(escrowAmount);
        });

        // Test that the initial status is 0 (Created)
        it("should start with status 0 (Created)", async () => {
            expect(await contract.status()).to.equal(0);
        });
    });

    describe("Funding", () => {
        // Test that the realtor can fund the escrow and status changes to 1 (Funded)
        it("should allow realtor to fund the escrow", async () => {
            await expect(contract.connect(realtor).fund({ value: escrowAmount }))
                .to.emit(contract, "Funded")
                .withArgs(realtor.address, escrowAmount);

            expect(await contract.status()).to.equal(1);

            // Check that the contract actually holds the funds
            const addr = await contract.getAddress(); // v6
            expect(await ethers.provider.getBalance(addr)).to.equal(escrowAmount);
        });

        // Test validation: sending the wrong amount should revert
        it("should revert if incorrect amount sent", async () => {
            const wrongAmount = ethers.parseEther("0.5");
            await expect(contract.connect(realtor).fund({ value: wrongAmount }))
                .to.be.revertedWith("Must send exact amount");
        });

        // Test validation: cannot fund twice
        it("should revert if already funded", async () => {
            await contract.connect(realtor).fund({ value: escrowAmount });
            await expect(contract.connect(realtor).fund({ value: escrowAmount }))
                .to.be.revertedWith("Already funded or active");
        });
    });

    describe("Approval", () => {
        beforeEach(async () => {
            // Fund the contract before testing approval
            await contract.connect(realtor).fund({ value: escrowAmount });
        });

        // Test that the realtor can approve the work, changing status to 2 (Approved)
        it("should allow realtor to approve", async () => {
            await expect(contract.connect(realtor).approve())
                .to.emit(contract, "Approved")
                .withArgs(realtor.address);

            expect(await contract.status()).to.equal(2);
        });

        // Test validation: only the realtor can approve
        it("should revert if not realtor", async () => {
            await expect(contract.connect(contractor).approve()).to.be.revertedWith(
                "Only realtor"
            );
        });

        // Test validation: cannot approve if not yet funded
        it("should revert if not funded", async () => {
            const Escrow = await ethers.getContractFactory(
                "RealtorContractorEscrowTwoParty",
                realtor
            );
            const newContract = await Escrow.deploy(contractor.address, escrowAmount);
            await newContract.waitForDeployment();

            await expect(newContract.connect(realtor).approve()).to.be.revertedWith(
                "Not funded"
            );
        });
    });

    describe("Withdrawal", () => {
        beforeEach(async () => {
            // Fund and approve before testing withdrawal
            await contract.connect(realtor).fund({ value: escrowAmount });
            await contract.connect(realtor).approve();
        });

        // Test that the contractor can withdraw the funds after approval
        it("should allow contractor to withdraw after approval", async () => {
            await expect(() => contract.connect(contractor).withdraw())
                .to.changeEtherBalances([contractor], [escrowAmount]);

            expect(await contract.status()).to.equal(3); // Status 3 = Paid
        });

        // Test validation: cannot withdraw if not yet approved
        it("should revert if not approved", async () => {
            const Escrow = await ethers.getContractFactory(
                "RealtorContractorEscrowTwoParty",
                realtor
            );
            const newContract = await Escrow.deploy(contractor.address, escrowAmount);
            await newContract.waitForDeployment();

            await newContract.connect(realtor).fund({ value: escrowAmount });

            await expect(newContract.connect(contractor).withdraw()).to.be.revertedWith(
                "Not approved"
            );
        });
    });

    describe("Refund", () => {
        beforeEach(async () => {
            // Fund before testing refund
            await contract.connect(realtor).fund({ value: escrowAmount });
        });

        // Test that the realtor can get a refund if the work isn't approved yet
        it("should allow realtor to refund before approval", async () => {
            await expect(() => contract.connect(realtor).refund())
                .to.changeEtherBalances([realtor], [escrowAmount]);

            expect(await contract.status()).to.equal(4); // Status 4 = Refunded
        });

        // Test validation: cannot refund once approved
        it("should revert if already approved", async () => {
            await contract.connect(realtor).approve();
            await expect(contract.connect(realtor).refund()).to.be.revertedWith(
                "Can only refund when funded and not approved"
            );
        });
    });
});
