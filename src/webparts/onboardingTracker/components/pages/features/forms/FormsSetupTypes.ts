export interface IFormTask {
  id: number;
  title: string;
}

export interface IAnswerDraft {
  // React key, stable while editing
  key: string;
  // list item id; undefined for answers not saved yet
  id: number | undefined;
  text: string;
}

export interface IQuestionDraft {
  key: string;
  id: number | undefined;
  text: string;
  // true: the employee uploads one image; false: the employee picks one of the text answers
  isImage: boolean;
  // existing Answers row that carries IsImageUploadField
  imageAnswerId: number | undefined;
  answers: IAnswerDraft[];
}

export interface IFormDraft {
  // Forms row of the task; undefined until the first save
  formId: number | undefined;
  questions: IQuestionDraft[];
}

export const EMPTY_FORM: IFormDraft = { formId: undefined, questions: [] };

let keyCounter = 0;
export const newKey = (): string => `k${++keyCounter}`;

export const newAnswer = (): IAnswerDraft => ({ key: newKey(), id: undefined, text: '' });

export const newQuestion = (): IQuestionDraft => ({
  key: newKey(),
  id: undefined,
  text: '',
  isImage: false,
  imageAnswerId: undefined,
  answers: [newAnswer(), newAnswer()]
});

// Returns a message for the first problem found, or '' when the draft can be saved.
export function validateForm(draft: IFormDraft): string {
  for (let i = 0; i < draft.questions.length; i++) {
    const question = draft.questions[i];
    if (!question.text.trim()) {
      return `${i + 1}-р асуултын текст хоосон байна.`;
    }
    if (!question.isImage && !question.answers.some(answer => answer.text.trim())) {
      return `${i + 1}-р асуултад дор хаяж нэг хариулт оруулна уу.`;
    }
  }
  return '';
}
