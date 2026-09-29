from agent.llm import generate_text

LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "hinglish": "Hinglish (mixed Hindi/English)"}


async def translate_response(text: str, *, target_language: str) -> str:
    """Translate/rephrase a piece of text into the requested language —
    used for one-off requests like 'say that in Hindi', distinct from
    change_language() which switches the whole conversation going forward."""
    language_name = LANGUAGE_NAMES.get(target_language, target_language)
    return await generate_text(
        f"Rephrase this in natural, spoken {language_name}. Keep the meaning identical, "
        f"don't add anything new:\n\n{text}",
        system_instruction="You translate a voice AI tutor's response for a student. Return only the translated text.",
        temperature=0.3,
    )
