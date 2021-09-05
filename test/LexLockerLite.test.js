const { artifacts, ethers } = require("hardhat");
const { expect } = require("chai");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const bentoAddress = "0xF5BCE5077908a1b7370B9ae04AdC565EBd643966";
 
chai
  .use(solidity)
  .should();
 
describe("LexLockerLite", function () {
  it("Should take an ERC20 token deposit and allow release by depositor", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc", 100000);
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLockerLite");
    const locker = await Locker.deploy();
    await locker.deployed();
 
    const bento = await ethers.getContractAt("IBentoBoxV1", bentoAddress);
    
    token.approve(bentoAddress, 10000);
    token.approve(locker.address, 10000);
    
    await locker.connect(resolver).registerResolver(10, true);
    await locker.deposit(receiver.address, resolver.address, token.address, 1000, false, "TEST");
    await locker.release(1);
  });
 
  it("Should take an ERC20 token deposit and forbid release by non-depositor", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();
 
    const Token = await ethers.getContractFactory("TestERC20");
    const token = await Token.deploy("poc", "poc", 100000);
    await token.deployed();
 
    const Locker = await ethers.getContractFactory("LexLockerLite");
    const locker = await Locker.deploy();
    await locker.deployed();
 
    const bento = await ethers.getContractAt("IBentoBoxV1", bentoAddress);
    
    token.approve(bentoAddress, 10000);
    token.approve(locker.address, 10000);
    
    await locker.connect(resolver).registerResolver(10, true);
    await locker.deposit(receiver.address, resolver.address, token.address, 1000, false, "TEST");
    await locker.connect(receiver).release(1).should.be.revertedWith("not depositor");
  });
 
  it("Should take an ERC721 NFT deposit and allow release by depositor", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();
 
    const NFT = await ethers.getContractFactory("TestERC721");
    const nft = await NFT.deploy();
    await nft.deployed();
 
    const Locker = await ethers.getContractFactory("LexLockerLite");
    const locker = await Locker.deploy();
    await locker.deployed();
 
    await nft.mint(1, "TEST");
    await nft.approve(locker.address, 1);
    
    await locker.connect(resolver).registerResolver(10, true);
    await locker.deposit(receiver.address, resolver.address, nft.address, 1, true, "TEST");
    await locker.release(1);
  });
 
  it("Should take an ERC721 NFT deposit and forbid release by non-depositor", async function () {
    let depositor, receiver, resolver;
    [depositor, receiver, resolver] = await ethers.getSigners();
 
    const NFT = await ethers.getContractFactory("TestERC721");
    const nft = await NFT.deploy();
    await nft.deployed();
 
    const Locker = await ethers.getContractFactory("LexLockerLite");
    const locker = await Locker.deploy();
    await locker.deployed();
 
    await nft.mint(1, "TEST");
    await nft.approve(locker.address, 1);
    
    await locker.connect(resolver).registerResolver(10, true);
    await locker.deposit(receiver.address, resolver.address, nft.address, 1, true, "TEST");
    await locker.connect(receiver).release(1).should.be.revertedWith("not depositor");
  });
});
 

