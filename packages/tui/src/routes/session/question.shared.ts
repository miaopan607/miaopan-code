export const QUESTION_NOTE_PREFIX = "user_note: "

export function appendQuestionNote(answer: ReadonlyArray<string>, note: string) {
  const value = note.trim()
  if (!value) return [...answer]
  return [...answer, `${QUESTION_NOTE_PREFIX}${value}`]
}

export function splitQuestionAnswer(answer: ReadonlyArray<string>) {
  const answers: string[] = []
  const notes: string[] = []

  for (const value of answer) {
    if (value.startsWith(QUESTION_NOTE_PREFIX)) {
      const note = value.slice(QUESTION_NOTE_PREFIX.length).trim()
      if (note) notes.push(note)
      continue
    }
    answers.push(value)
  }

  return { answers, notes }
}
