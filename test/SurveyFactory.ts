import { expect } from "chai";
import { network } from "hardhat";
import type {
  HardhatEthers,
  HardhatEthersSigner,
} from "@nomicfoundation/hardhat-ethers/types";
import type {
  SurveyFactory,
  SurveySchemaStruct,
} from "../types/ethers-contracts/SurveyFactory.js";

describe("SurveyFactory Contract", () => {
  let ethers: HardhatEthers;
  let factory: SurveyFactory;
  let owner: HardhatEthersSigner;
  let respondent1: HardhatEthersSigner;
  let respondent2: HardhatEthersSigner;
  let surveySchema: SurveySchemaStruct;

  beforeEach(async () => {
    ({ ethers } = await network.connect());
    [owner, respondent1, respondent2] = await ethers.getSigners();

    factory = await ethers.deployContract("SurveyFactory", [
      ethers.parseEther("50"),
      ethers.parseEther("0.1"),
    ]);
    await factory.waitForDeployment();

    surveySchema = {
      title: "SurveyFactory test survey",
      description: "A survey created through the factory",
      targetNumber: 100,
      questions: [
        {
          question: "Which survey platform do you prefer?",
          options: ["Centralized", "Decentralized", "No preference"],
        },
      ],
    };
  });

  it("should deploy with correct minimum amounts", async () => {
    expect(await factory.min_pool_amount()).to.equal(ethers.parseEther("50"));
    expect(await factory.min_reward_amount()).to.equal(
      ethers.parseEther("0.1"),
    );
  });

  it("should create a new survey when valid values are provided", async () => {
    const poolAmount = ethers.parseEther("50");
    // Both minimums must accept equality: 50 ETH / 500 = 0.1 ETH.
    surveySchema.targetNumber = 500;
    expect(await factory.getSurveys()).to.deep.equal([]);

    const tx = await factory.connect(owner).createSurvey(surveySchema, {
      value: poolAmount,
    });
    await tx.wait();

    const surveys = await factory.getSurveys();
    expect(surveys).to.have.lengthOf(1);
    expect(surveys[0]).to.not.equal(ethers.ZeroAddress);
    await expect(tx).to.emit(factory, "SurveyCreated").withArgs(surveys[0]);

    const survey = await ethers.getContractAt("Survey", surveys[0]);
    expect(await survey.title()).to.equal(surveySchema.title);
    expect(await survey.description()).to.equal(surveySchema.description);
    expect(await survey.targetNumber()).to.equal(500n);
    expect(await survey.rewardAmount()).to.equal(ethers.parseEther("0.1"));
    expect(await survey.getQuestions()).to.deep.equal(
      surveySchema.questions.map(({ question, options }) => [
        question,
        options,
      ]),
    );
    expect(await ethers.provider.getBalance(survey)).to.equal(poolAmount);
  });

  it("should revert if pool amount is too small", async () => {
    // Keep the reward above its minimum so only the pool check can fail.
    await expect(
      factory.createSurvey(surveySchema, {
        value: ethers.parseEther("50") - 1n,
      }),
    ).to.be.revertedWith("insufficient pool amount");

    expect(await factory.getSurveys()).to.deep.equal([]);
  });

  it("should revert if reward amount per respondent is too small", async () => {
    // The pool meets its minimum, but 50 ETH / 501 is below 0.1 ETH.
    surveySchema.targetNumber = 501;
    await expect(
      factory.createSurvey(surveySchema, {
        value: ethers.parseEther("50"),
      }),
    ).to.be.revertedWith("insufficient reward amount");

    expect(await factory.getSurveys()).to.deep.equal([]);
  });

  it("should store created surveys and return them from getSurveys", async () => {
    expect(await factory.getSurveys()).to.deep.equal([]);
    const schemas: SurveySchemaStruct[] = [
      surveySchema,
      {
        title: "Second survey",
        description: "A separate survey with different questions",
        targetNumber: 200,
        questions: [
          { question: "Do you use a wallet?", options: ["Yes", "No"] },
          { question: "How often?", options: ["Daily", "Weekly", "Never"] },
        ],
      },
    ];
    const creators = [respondent1, respondent2];
    const poolAmounts = [ethers.parseEther("50"), ethers.parseEther("80")];
    const createdAddresses: string[] = [];

    for (const [index, schema] of schemas.entries()) {
      const tx = await factory.connect(creators[index]).createSurvey(schema, {
        value: poolAmounts[index],
      });
      await tx.wait();

      const surveys = await factory.getSurveys();
      expect(surveys).to.have.lengthOf(index + 1);
      const address = surveys[index];
      expect(address).to.not.equal(ethers.ZeroAddress);
      expect(createdAddresses).to.not.include(address);
      await expect(tx).to.emit(factory, "SurveyCreated").withArgs(address);

      createdAddresses.push(address);
      expect(surveys).to.deep.equal(createdAddresses);
    }

    const surveys = await factory.getSurveys();
    expect(surveys).to.deep.equal(createdAddresses);
    for (const [index, address] of surveys.entries()) {
      const survey = await ethers.getContractAt("Survey", address);
      const schema = schemas[index];
      expect(await survey.title()).to.equal(schema.title);
      expect(await survey.description()).to.equal(schema.description);
      expect(await survey.targetNumber()).to.equal(BigInt(schema.targetNumber));
      expect(await survey.rewardAmount()).to.equal(
        poolAmounts[index] / BigInt(schema.targetNumber),
      );
      expect(await survey.getQuestions()).to.deep.equal(
        schema.questions.map(({ question, options }) => [question, options]),
      );
      expect(await ethers.provider.getBalance(survey)).to.equal(
        poolAmounts[index],
      );
    }
  });
});
