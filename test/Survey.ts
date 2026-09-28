import { expect } from "chai";
import { network } from "hardhat";

interface Question {
  question: string;
  options: string[];
}

it("Survey init", async () => {
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
  ];

  const factory = await ethers.deployContract("SurveyFactory", [
    ethers.parseEther("50"),
    ethers.parseEther("0.1"),
  ]);
  const tx = await factory.createSurvey(
    {
      title,
      description,
      targetNumber: 100,
      questions,
    },
    {
      value: ethers.parseEther("100"),
    },
  );

  await tx.wait();
  const surveys = await factory.getSurveys();
  expect(surveys).to.have.lengthOf(1);
  await expect(tx).to.emit(factory, "SurveyCreated").withArgs(surveys[0]);

  const survey = await ethers.getContractAt("Survey", surveys[0]);
  const [, respondent] = await ethers.getSigners();
  const rewardAmount = ethers.parseEther("1");
  expect(await survey.title()).to.equal(title);
  expect(await survey.description()).to.equal(description);
  expect(await survey.targetNumber()).to.equal(100n);
  expect(await survey.rewardAmount()).to.equal(rewardAmount);
  expect(await survey.getQuestions()).to.deep.equal(
    questions.map(({ question, options }) => [question, options]),
  );
  expect(await survey.getAnswers()).to.deep.equal([]);

  await expect(
    survey.connect(respondent).submitAnswer({
      respondent: respondent.address,
      answers: [1],
    }),
  ).to.changeEtherBalances(
    ethers,
    [survey, respondent],
    [-rewardAmount, rewardAmount],
  );

  expect(await survey.getAnswers()).to.deep.equal([[respondent.address, [1n]]]);
});
