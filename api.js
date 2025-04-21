const express = require("express");
const router = express.Router();

router.get("/question", (req, res) => {
  const operatorsPool = ["+", "-", "", "/"];
  let numbers, operators, answer;
  let expression;

  while (true) {
    numbers = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9) + 1);
    operators = Array.from({ length: 3 }, () => {
      return operatorsPool[Math.floor(Math.random() * operatorsPool.length)];
    });

    expression = `${numbers[0]} ${operators[0]} ${numbers[1]} ${operators[1]} ${numbers[2]} ${operators[2]} ${numbers[3]}`;

    try {
      const result = eval(expression);
      if (
        isFinite(result) &&
        !isNaN(result) &&
        result >= 10 &&
        result <= 100 &&
        Number.isInteger(result)
      ) {
        answer = result;
        break;
      }
    } catch (err) {
      console.error("Eval error:", err);
    }
  }

  console.log("ส่งโจทย์:", { numbers, operators, expression, answer });

  res.json({
    numbers,
    operators,
    expression,
    answer,
  });
});

let firstCorrectExpression = null;

router.post("/check-answer", (req, res) => {
  const { userExpression, originalExpression, answer, timeTaken } = req.body;

  try {
    const userAnswer = eval(userExpression);
    const expectedAnswer = Number(answer);
    const isCorrect = Number(userAnswer) === expectedAnswer;

    const time = Math.min(Math.max(Number(timeTaken), 0), 20); // clamp 0-20

    const baseResponse = {
      correct: isCorrect,
      originalExpression,
      answer: expectedAnswer,
      firstCorrectExpression,
    };

    // ✅ ตรวจว่าหมดเวลา (ตอบถูกแต่ช้าเกิน 20 วิ)
    const isTimeout = time >= 20;

    if (isCorrect) {
      const score = isTimeout ? 0 : Math.round((1 - time / 20) * 100);

      if (!firstCorrectExpression) {
        firstCorrectExpression = userExpression;
        console.log("✅ บันทึกวิธีคิดแรก:", userExpression);
      }

      return res.json({
        ...baseResponse,
        message: isTimeout ? "หมดเวลา" : "คำตอบถูกต้อง",
        score,
      });
    } else {
      return res.json({
        ...baseResponse,
        message: isTimeout ? "หมดเวลา" :"คำตอบผิด",
        score: 0,
      });
    }
  } catch (err) {
    return res.status(500).json({
      correct: false,
      message: "เกิดข้อผิดพลาดในการตรวจคำตอบ",
      score: 0,
      originalExpression,
      answer: Number(answer),
      firstCorrectExpression,
    });
  }
});

module.exports = router;
