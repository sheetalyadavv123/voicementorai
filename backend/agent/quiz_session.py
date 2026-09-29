from dataclasses import dataclass, field

from agent.quiz_schemas import QuizQuestion


@dataclass
class QuizSession:
    """Lives only for the duration of one LiveKit room (see agent/worker.py's
    session userdata) — the ask/wait/evaluate loop happens across several
    tool calls within the same voice conversation, so this holds the state
    between them. Final results are written to quiz_attempts per question
    as they're evaluated, so nothing is lost if the call drops mid-quiz."""

    topic: str = ""
    questions: list[QuizQuestion] = field(default_factory=list)
    current_index: int = 0
    score: int = 0

    @property
    def is_active(self) -> bool:
        return bool(self.questions) and self.current_index < len(self.questions)

    @property
    def current_question(self) -> QuizQuestion | None:
        if not self.is_active:
            return None
        return self.questions[self.current_index]

    def advance(self) -> None:
        self.current_index += 1

    def reset(self) -> None:
        self.topic = ""
        self.questions = []
        self.current_index = 0
        self.score = 0
