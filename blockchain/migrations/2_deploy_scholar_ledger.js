const ScholarLedger = artifacts.require("ScholarLedger");
const IssuerRegistry = artifacts.require("IssuerRegistry");
const StudentProfileRegistry = artifacts.require("StudentProfileRegistry");
const AccreditationRegistry = artifacts.require("AccreditationRegistry");

module.exports = async function (deployer) {
    await deployer.deploy(ScholarLedger);
    await deployer.deploy(IssuerRegistry);
    await deployer.deploy(StudentProfileRegistry);
    await deployer.deploy(AccreditationRegistry);

    const sl = await ScholarLedger.deployed();
    const ir = await IssuerRegistry.deployed();
    const spr = await StudentProfileRegistry.deployed();
    const ar = await AccreditationRegistry.deployed();

    console.log("");
    console.log("=== Scholar Ledger Deployment Summary ===");
    console.log("ScholarLedger          :", sl.address);
    console.log("IssuerRegistry         :", ir.address);
    console.log("StudentProfileRegistry :", spr.address);
    console.log("AccreditationRegistry  :", ar.address);
    console.log("==========================================");
    console.log("");
};
