import { expect } from "chai";
import { keccak256 } from "ethers";
import { network } from "hardhat";

interface Question {
  question: string;
  options: string[];
}

describe("Survey init", () => {
  const title = "막무가내 설문조사라면";
  const description =
    "중앙화된 설문조사로서, 모든 데이터는 공개되지 않으며 설문조사를 게시한자만 볼 수 있습니다.";
  const questions: Question[] = [
    {
      question: "누가 내 응답을 관리할때 더 솔직할 수 있을까요?",
      options: [
        "구글폼 운영자",
        "탈중앙화된 블록체인 (관리주체 없으며 모든 데이터 공개)",
        "상관없음",
      ],
    },
  ];
  const surveyInfo = { title, description, targetNumber: 100, questions };

  const getSurveyContractAndEthers = async (
    survey: typeof surveyInfo = surveyInfo,
    poolAmount = 100n * 10n ** 18n,
  ) => {
    const { ethers } = await network.connect();
    const cSurvey = await ethers.deployContract(
      "Survey",
      [survey.title, survey.description, survey.targetNumber, survey.questions],
      { value: poolAmount },
    );
    await cSurvey.waitForDeployment();
    return { ethers, cSurvey };
  };

  describe("Deployment", () => {
    it("should store survey info correctly", async () => {
      const { cSurvey } = await getSurveyContractAndEthers();

      expect(await cSurvey.title()).to.equal(title);
      expect(await cSurvey.description()).to.equal(description);
      expect(await cSurvey.targetNumber()).to.equal(100n);
      expect(await cSurvey.getAnswers()).to.deep.equal([]);
    });

    it("should calculate rewardAmount correctly", async () => {
      // Include a remainder to verify Solidity's integer division in wei.
      const poolAmount = 10n ** 18n;
      const { ethers, cSurvey } = await getSurveyContractAndEthers(
        { ...surveyInfo, targetNumber: 3 },
        poolAmount,
      );

      expect(await cSurvey.rewardAmount()).to.equal(poolAmount / 3n);
      expect(await ethers.provider.getBalance(cSurvey)).to.equal(poolAmount);
    });
  });

  describe("Questions and Answers", () => {
    it("should return questions correctly", async () => {
      const surveyQuestions = [
        ...questions,
        { question: "메타마스크를 사용해 보셨나요?", options: ["예", "아니요"] },
      ];
      const { cSurvey } = await getSurveyContractAndEthers({
        ...surveyInfo,
        questions: surveyQuestions,
      });

      expect(await cSurvey.getQuestions()).to.deep.equal(
        surveyQuestions.map(({ question, options }) => [question, options]),
      );
    });

    it("should allow valid answer submission", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers();
      const [, respondent] = await ethers.getSigners();

      const tx = await cSurvey.connect(respondent).submitAnswer({
        respondent: respondent.address,
        answers: [1],
      });
      await tx.wait();

      expect(await cSurvey.getAnswers()).to.deep.equal([
        [respondent.address, [1n]],
      ]);
    });

    it("should revert if answer length mismatch", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers();
      const [, respondent] = await ethers.getSigners();
      const initialBalance = await ethers.provider.getBalance(cSurvey);

      for (const answers of [[], [0, 1]]) {
        await expect(
          cSurvey.connect(respondent).submitAnswer({
            respondent: respondent.address,
            answers,
          }),
        ).to.be.revertedWith("Mismatched answers length");
      }

      expect(await cSurvey.getAnswers()).to.deep.equal([]);
      expect(await ethers.provider.getBalance(cSurvey)).to.equal(initialBalance);
    });

    it("should revert if target reached", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers({
        ...surveyInfo,
        targetNumber: 1,
      });
      const [, firstRespondent, nextRespondent] = await ethers.getSigners();
      const tx = await cSurvey.connect(firstRespondent).submitAnswer({
        respondent: firstRespondent.address,
        answers: [1],
      });
      await tx.wait();

      await expect(
        cSurvey.connect(nextRespondent).submitAnswer({
          respondent: nextRespondent.address,
          answers: [2],
        }),
      ).to.be.revertedWith("This survey has been ended");

      expect(await cSurvey.getAnswers()).to.deep.equal([
        [firstRespondent.address, [1n]],
      ]);
      expect(await ethers.provider.getBalance(cSurvey)).to.equal(0n);
    });
  });

  describe("Rewards", () => {
    it("should pay correct reward to respondent", async () => {
      const { ethers, cSurvey } = await getSurveyContractAndEthers();
      const [, respondent] = await ethers.getSigners();
      const expectedReward = ethers.parseEther("1");

      // The matcher excludes transaction gas from the respondent's balance.
      await expect(
        cSurvey.connect(respondent).submitAnswer({
          respondent: respondent.address,
          answers: [1],
        }),
      ).to.changeEtherBalances(
        ethers,
        [cSurvey, respondent],
        [-expectedReward, expectedReward],
      );
      expect(await ethers.provider.getBalance(cSurvey)).to.equal(
        ethers.parseEther("99"),
      );
    });
  });
});

// it("Survey init", async () => {
//   const { ethers } = await network.connect();

//   const title = "막무가내 설문조사";
//   const description =
//     "중앙화된 설문조사로서, 모든 데이터는 공개되지 않으며 설문조사를 게시한자만 볼 수 있습니다.";
//   const questions: Question[] = [
//     {
//       question: "누가 내 응답을 관리할 때 더 솔직할 수 있을까요?",
//       options: [
//         "구글폼 운영자",
//         "탈중앙화된 블록체인 (관리주체 없으며 모든 데이터 공개)",
//         "상관없음",
//       ],
//     },
//   ];

//   const factory = await ethers.deployContract("SurveyFactory", [
//     ethers.parseEther("50"),
//     ethers.parseEther("0.1"),
//   ]);
//   const tx = await factory.createSurvey(
//     {
//       title,
//       description,
//       targetNumber: 100,
//       questions,
//     },
//     {
//       value: ethers.parseEther("100"),
//     },
//   );

//   await tx.wait();
//   const surveys = await factory.getSurveys();
//   expect(surveys).to.have.lengthOf(1);
//   await expect(tx).to.emit(factory, "SurveyCreated").withArgs(surveys[0]);

//   const survey = await ethers.getContractAt("Survey", surveys[0]);
//   const [, respondent] = await ethers.getSigners();
//   const rewardAmount = ethers.parseEther("1");
//   expect(await survey.title()).to.equal(title);
//   expect(await survey.description()).to.equal(description);
//   expect(await survey.targetNumber()).to.equal(100n);
//   expect(await survey.rewardAmount()).to.equal(rewardAmount);
//   expect(await survey.getQuestions()).to.deep.equal(
//     questions.map(({ question, options }) => [question, options]),
//   );
//   expect(await survey.getAnswers()).to.deep.equal([]);

//   await expect(
//     survey.connect(respondent).submitAnswer({
//       respondent: respondent.address,
//       answers: [1],
//     }),
//   ).to.changeEtherBalances(
//     ethers,
//     [survey, respondent],
//     [-rewardAmount, rewardAmount],
//   );

//   expect(await survey.getAnswers()).to.deep.equal([[respondent.address, [1n]]]);
// });

it("Survey storage layout", async () => {
  const { ethers } = await network.connect();

  const title = "막무가내 설문조사";
  const description =
    "중앙화된 설문조사로서, 모든 데이터는 공개되지 않으며 설문조사를 게시한자만 볼 수 있습니다.";
  const questions: Question[] = [
    {
      question: "누가 내 응답을 관리할 때 더 솔직할 수 있을까요?",
      options: [
        "구글폼 운영자",
        "탈중앙화된 블록체인 (관리주체 없으며 모든 데이터 공개)",
        "상관없음",
      ],
    },
    {
      question: "test2",
      options: ["구글폼 운영자"],
    },
  ];

  const survey = await ethers.deployContract(
    "Survey",
    [title, description, 100, questions],
    {
      value: ethers.parseEther("100"),
    },
  );

  const slot0Data = await ethers.provider.getStorage(
    survey.getAddress(),
    ethers.toBeHex(0, 32),
  );
  const slot1Data = await ethers.provider.getStorage(
    survey.getAddress(),
    ethers.toBeHex(1, 32),
  );
  const slot2Data = await ethers.provider.getStorage(
    survey.getAddress(),
    ethers.toBeHex(2, 32),
  );
  const slot3Data = await ethers.provider.getStorage(
    survey.getAddress(),
    ethers.toBeHex(3, 32),
  );
  const slot4Data = await ethers.provider.getStorage(
    survey.getAddress(),
    ethers.toBeHex(4, 32),
  );
  const slot5Data = await ethers.provider.getStorage(
    survey.getAddress(),
    ethers.toBeHex(5, 32),
  );
  const slot6Data = await ethers.provider.getStorage(
    survey.getAddress(),
    ethers.toBeHex(6, 32),
  );
  const decodeUni = (hex: string) =>
    Buffer.from(hex.slice(2), "hex").toString("utf-8");

  const nextHash = (hex: string, i: number) =>
    "0x" + (BigInt(hex) + BigInt(i)).toString(16);

  console.log(slot0Data);

  // primitive type
  console.log("\n---primitive types---");
  console.log(slot2Data);
  console.log(slot3Data);

  // long string type
  console.log("\n---long string type---");
  console.log(slot1Data); // 0x103 == 259, 129
  const pDesc = keccak256(ethers.toBeHex(1, 32));
  const desc0 = await ethers.provider.getStorage(
    await survey.getAddress(),
    nextHash(pDesc, 0),
  );
  const desc1 = await ethers.provider.getStorage(
    await survey.getAddress(),
    nextHash(pDesc, 1),
  );
  const desc2 = await ethers.provider.getStorage(
    await survey.getAddress(),
    nextHash(pDesc, 2),
  );
  const desc3 = await ethers.provider.getStorage(
    await survey.getAddress(),
    nextHash(pDesc, 3),
  );
  const desc4 = await ethers.provider.getStorage(
    await survey.getAddress(),
    nextHash(pDesc, 4),
  );

  console.log(desc0);
  console.log(desc1);
  console.log(desc2);
  console.log(desc3);
  console.log(desc4);

  // Array type
  // pQuestions : 0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b
  // pQuestions + 1 : 0x8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19c
  // question1 <----------- pQuestions
  // question1_option[] <-- pQuestions + 1 (c)
  // question2 <----------- pQuestions + 2 (d)
  // question2_option[] <-- pQuestions + 3 (e)
  console.log("\n---array & structure type---");
  console.log("slot4Data", slot4Data);
  const pQuestions = keccak256(ethers.toBeHex(4, 32));
  const question1 = await ethers.provider.getStorage(
    survey.getAddress(),
    nextHash(pQuestions, 0),
  );
  const question1_option_array = await ethers.provider.getStorage(
    survey.getAddress(),
    nextHash(pQuestions, 1),
  );
  const question2 = await ethers.provider.getStorage(
    survey.getAddress(),
    nextHash(pQuestions, 2),
  );
  const question2_option_array = await ethers.provider.getStorage(
    survey.getAddress(),
    nextHash(pQuestions, 3),
  );
  console.log("question1", question1);
  console.log("question1_option_array", question1_option_array);
  console.log("question2", question2, decodeUni(question2));
  console.log("question2_option_array", question2_option_array);

  // map
  // map[keccak256(k, slot address)]
  console.log(slot6Data);
  const addr = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
  const mapKeyAddr = keccak256(
    ethers.toBeHex(addr, 32) + ethers.toBeHex(6, 32).slice(2),
  );
  const map1Value = await ethers.provider.getStorage(
    survey.getAddress(),
    mapKeyAddr,
  );
  console.log(map1Value);
});
