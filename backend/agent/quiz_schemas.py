from pydantic import BaseModel, Field


class QuizQuestion(BaseModel):
    question: str
    correct_answer: str
    explanation: str = Field(description="Short explanation shown after the student answers")


class QuizQuestionSet(BaseModel):
    questions: list[QuizQuestion]


class AnswerEvaluation(BaseModel):
    is_correct: bool
    feedback: str = Field(description="Short spoken feedback, 1-2 sentences, encouraging in tone")
