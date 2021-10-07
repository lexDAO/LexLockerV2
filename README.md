# LexLocker

[LexLocker](https://github.com/lexDAO/LexLockerV2) is an escrow system designed by [LexDAO legal engineers](https://twitter.com/lex_DAO) for business use cases on [EVM-compatible chains](https://ethereum.org/en/). 

Users might call on LexLocker to hold a deposit for the delivery of goods or services without needing bank accounts or reliance on trusted third parties to wire funds. 

All that is needed is a [wallet](https://ethereum.org/en/wallets/). 

Everything else is handled by code in a true peer-to-peer fashion.

## User Story

Let's say Alice wants to hire Bob for a quick job building her a website. She doesn't need to know Bob's name, really, just his wallet address. But anyways ....

She first takes a look at the legal forms maintained by LexDAO, like this [services agreement](https://github.com/lexDAO/LexCorpus/blob/master/contracts/legal/Services.md).

Then, she attaches these terms to a LexLocker escrow deposit by calling the smart contract with the integer `1` representing the on-chain representation of this form. These terms lay out the basic expectations of the work to be completed as well as provide a fallback in the event either party tries to take this deal to meatspace court.

After calling `deposit` on LexLocker, the funds for the work, $2000 DAI, then automatically get deposited with the selected `termination` time limit (say, 2 weeks) for Bob to complete her website.

If 2 weeks passes and Bob doesn't raise a dispute by calling `lock`, Alice can reclaim her deposit. These are the terms embodied by the code and the `withdraw` function, after all.

Otherwise, if Bob does the requested job, Alice can `release` the funds and they will be immediately sent to Bob.

That simple. *Done deal*.

## BentoBox Yield
In addition to standard escrow, deposits can also take advantage of ["defi"](https://ethereum.org/en/defi/) yield by holding tokens as [BentoBox shares](https://etherscan.io/address/0xf5bce5077908a1b7370b9ae04adc565ebd643966#code). 

This means that the opportunity cost of payments being held idle is not lost, as payments increase for the recipient (and/or the depositor, upon claiming funds back or the resolution of a dispute).

[BentoBox earnings](https://docs.sushi.com/products/bentobox) occur through the support of flash lending and strategies.

## Multi-Asset

LexLocker currently supports timed deposits for [ERC20 tokens](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/), as well as [Ether](https://ethereum.org/en/eth/) (or similar native currency on EVM chains) and [ERC721 NFTs](https://ethereum.org/en/nft/).

## TX-Batching

Multiple escrows and LexLocker actions, such as releasing funds, can be combined into a single transaction through the use of `multicall` functionality. This also effectively allows for milestone payments.

## Gas-less Invoicing

Using the standard for off-chain signature recovery, [EIP-712](https://eips.ethereum.org/EIPS/eip-712), LexLocker allows a `receiver` party to sign and request an escrow deposit without needing to spend gas. In this manner, more legal privity can be established between parties (aside from course of performance), as key signatures between both `depositor` and `receiver` are established upon the registration with the `depositWithInvoiceSig` function.

## Deployments

Ethereum mainnet: [`0xF64440519992D28771414732653Af51e7866ca31`](https://etherscan.io/address/0xf64440519992d28771414732653af51e7866ca31#code)

Polygon: [`0xc31699bf207b37d65ddb2147aA416662eE2521b6`](https://polygonscan.com/address/0x455CfAa64b706BC0534bd08B9570aE7CbDDd7a0F#code) **ALPHA**

## Tests

[Javascript tests](https://github.com/lexDAO/LexLockerV2/blob/main/test/LexLocker.test.js) are provided that provide comprehensive coverage of expected LexLocker operations.

![image](https://user-images.githubusercontent.com/41117279/135812750-1cb5a169-e27f-4857-a1ae-15ecf94fe432.png)

## Escrow Protocol

Users can make a deposit directed to a `receiver` account as well as select an arbiter `resolver` in the event of dispute or other problems (such as one party losing keys). 

The `token` selected can either be an ERC20 or ERC721 NFT. In either case, if ETH is attached to the call (`msg.value`), this will be overriden and ETH will be assumed as deposit. Such ETH must match the `value` selected in wei. 

Otherwise, in the case of token deposits, the selected `value` will be escrowed after LexLocker is approved to pull tokens from the user wallet. 

Note, however, through batching support in `multicall` on tokens that have an EIP-2612 `permit` function (or DAI-derived version), the approval step can be included in a single TX, by means of the `permitThis` and `permitThisAllowed` functions, respectively.

If `nft` bool is set as 'true', LexLocker will be instructed to pull the `value` as an ERC721 `tokenId`.

Finally, `details` can be included to provide an on-chain reference for an agreement or other context parties feel might be important for course of dealing. Note, LexLocker includes an internal legal library of forms maintained by LexDAO, which may be efficienctly included as integers in this param, with the additional benefit of an immutable record key-signed by the parties.

![](https://i.imgur.com/680UKaj.png)

Similarly, the `depositBento` function instructs LexLocker to pull ETH and ERC20 tokens and store them into the BentoBox vault as shares that can earn yield for the parties. 

The bool param `wrapBento`, if 'true', will pull and automatically deposit ERC20 tokens into BentoBox shares, otherwise, LexLocker will complete a shares transfer from the user's BentoBox account. Note, the user should have called `setMasterContractApproval` on BentoBox for direct transfers to succeed, which can be combined into a single TX through `multicall` and the `setBentoApproval` function in LexLocker, which incorporates EIP-712 signatures.

![](https://i.imgur.com/aRbhQS9.png)

An invoice pattern by a `receiver` can be further serviced by EIP-712 signature recovery and the `depositWithInvoiceSig` function. In this case, the `bentoBoxed` param represents the choice to make an integrated call to the `depositBento` function. Otherwise, the other params are fed into a typical deposit pattern, with the `v` / `r` / `s` param representing the elements of the off-chain signature for recovery.

![](https://i.imgur.com/rr9ta5P.png)

After a deposit is made through one of the methods described above, the `depositor` can `release` funds at anytime after they are satisfied with the deliverables of `receiver`.

![](https://i.imgur.com/UrXrZj4.png)

If the `termination` time is reached, as determined in [Unix epoch time](https://www.epochconverter.com/), the `depositor` may reclaim their funds by calling `withdraw`. This function will be frozen upon the call of a `lock` by either party (see below).

![](https://i.imgur.com/YfCeZ1o.png)

## Dispute Protocol

A LexLocker deposit may be frozen by either escrow party  upon calling the `lock` function, which reserves the funds for a determination by the selected `resolver`. The `registration` param is the incremented ID assigned to each new LexLocker escrow. Parties can continue to update their claims and descriptions of such dispute or safety `lock` through the `details` param which is stamped as an event on an EVM chain.

![](https://i.imgur.com/alaOtCq.png)

Anyone can join the LexLocker dispute protocol as a potential `resolver` by calling the `registerResolver` function with their status (if the `active` bool is set as `true`, this confirms willigness, which can be revoked) and `fee`, which is the divisor to determine how much they can be paid for resolving a LexLocker dispute or safety `lock`.

![](https://i.imgur.com/uTuMntI.png)

To claim such fees, only the `resolver` is permitted to call `release` and enter their judgment in terms of a `depositorAward` and `receiverAward` split.

![](https://i.imgur.com/4cPKFeE.png)

The 'resolver fee' is automatically calculated after awards are entered and forwarded to the `resolver`. Note, in the case of a locked NFT, the award must be the whole NFT, and therefore, it is an either or proposition. So, if `depositorAward` is a positive integer, the `depositor` will receive the locked NFT, but if set to 0, the NFT will be sent to the `receiver` (this format is for code simplicity, and also, the impossibility of splitting a non-fungible token). Clearly, in the case of NFTs, the resolver fee must be negotiated separately (but game theory suggests that something will be figured out, otherwise the `resolver` might leave the NFT in limbo).

## LexDAO Protocol

LexLocker can host on on-chain registry of legal agreements to complete the picture for '[ricardian contracts](https://iang.org/papers/ricardian_contract.html)', where [gaps in code can be plugged](http://unenumerated.blogspot.com/2006/11/wet-code-and-dry.html) by human readable descriptions of parties' intentions to instruct them, resolvers and courts in the event that something goes wrong or additional assistance is required. These legal templates are maintained by LexDAO on github as a '[LexCorpus](https://github.com/lexDAO/LexCorpus)'.

For this purpose, simple functions are assigned for adding 'strings' that can represent links or hashes to legal templates, identified by unique integers that can be included as `details` in LexLocker escrow deposits.

![](https://i.imgur.com/fCX3Z2s.png)

The `lexDAO` role can be updated, as well, as governance features are determined. 

![](https://i.imgur.com/8NEH8KJ.png)

Currently, for LexLocker `ALPHA`, a Gnosis Safe multisig consisting of [certified LexDAO legal engineers](https://github.com/lexDAO/Legal-Engineers) with 2/4 authority is deployed on Polygon for legal maintenance and potential inclusion as a `resolver` for LexLocker escrows: [`0xf8DBd458f841424e2fD5fBDf18A7dEA17eb2211D`](https://polygon.gnosis-safe.io/app/#/safes/0xf8DBd458f841424e2fD5fBDf18A7dEA17eb2211D/settings/owners). This multi-sig builds on prior experience working as an arbiter for Raid Guild escrow management, and follows the procedures set forth here: [LexDAO Arbitration](https://github.com/lexDAO/Arbitration).
