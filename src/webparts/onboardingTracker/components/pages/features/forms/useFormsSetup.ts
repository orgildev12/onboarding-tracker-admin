import * as React from 'react';
import type { IOnboardingTrackerProps } from '../../../IOnboardingTrackerProps';
import type { IListField, ListItem, ListService } from '../../../../services/ListService';
import { booleanValue, findFieldName, findLookupField, numberValue, readLookupId, readValue, textValue } from '../../../../utils/listFields';
import type { IAnswerDraft, IFormDraft, IFormTask, IQuestionDraft } from './FormsSetupTypes';
import { EMPTY_FORM, newKey } from './FormsSetupTypes';

type FormsSetupServices = Pick<IOnboardingTrackerProps, 'listService' | 'createListService'>;

interface IResolved {
  forms: ListService;
  questions: ListService;
  answers: ListService;
  formTask: string;
  questionForm: string;
  questionText: string;
  questionOrder: string;
  answerQuestion: string;
  answerText: string;
  answerOrder: string;
  answerImageFlag: string;
  answerCustomFlag: string;
  // lists whose required Title column is not the one holding the text
  questionNeedsTitle: boolean;
  answerNeedsTitle: boolean;
}

export interface IFormsSetup {
  tasks: IFormTask[];
  loading: boolean;
  error: string;
  loadForm: (taskId: number) => Promise<IFormDraft>;
  saveForm: (task: IFormTask, original: IFormDraft, draft: IFormDraft) => Promise<IFormDraft>;
}

const IMAGE_ANSWER_TEXT = 'Зураг';
const CUSTOM_ANSWER_TEXT = 'Өөрийн хариулт';

const byOrderThenId = (a: { order: number; id: number }, b: { order: number; id: number }): number =>
  a.order - b.order || a.id - b.id;

const needsTitle = (fields: IListField[], textField: string): boolean =>
  textField !== 'Title' && fields.some(field => field.InternalName === 'Title' && field.Required);

export function useFormsSetup({ listService, createListService }: FormsSetupServices): IFormsSetup {
  const [tasks, setTasks] = React.useState<IFormTask[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const resolved = React.useRef<Promise<IResolved> | undefined>(undefined);

  const resolve = React.useCallback((): Promise<IResolved> => {
    if (!resolved.current) {
      resolved.current = (async (): Promise<IResolved> => {
        const forms = createListService('Forms');
        const questions = createListService('FormsQuestions');
        const answers = createListService('Answers');
        const [formFields, questionFields, answerFields] = await Promise.all([
          forms.getFields(), questions.getFields(), answers.getFields()
        ]);
        const questionText = findFieldName(questionFields, ['Question'], 'Question');
        const answerText = findFieldName(answerFields, ['Answer'], 'Answer');
        return {
          forms,
          questions,
          answers,
          formTask: findLookupField(formFields, ['TaskID', 'Task'], 'TaskId'),
          questionForm: findLookupField(questionFields, ['FormsID', 'Forms', 'FormID', 'Form'], 'FormsId'),
          questionText,
          questionOrder: findFieldName(questionFields, ['Order'], 'Order'),
          answerQuestion: findLookupField(answerFields, ['FormsQuestionID', 'FormsQuestion'], 'FormsQuestionId'),
          answerText,
          answerOrder: findFieldName(answerFields, ['Order'], 'Order'),
          answerImageFlag: findFieldName(answerFields, ['IsImageUploadField'], 'IsImageUploadField'),
          answerCustomFlag: findFieldName(answerFields, ['IsCustomAnswerField'], 'IsCustomAnswerField'),
          questionNeedsTitle: needsTitle(questionFields, questionText),
          answerNeedsTitle: needsTitle(answerFields, answerText)
        };
      })();
      resolved.current.catch(() => { resolved.current = undefined; });
    }
    return resolved.current;
  }, [createListService]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listService.getAllItems()
      .then(items => {
        if (cancelled) {
          return;
        }
        setTasks(items
          .filter(item => textValue(item.TaskType) === 'Forms')
          .map(item => ({ id: numberValue(item.Id), title: textValue(item.Title) })));
      })
      .catch((e: Error) => { if (!cancelled) { setError(e.message); } })
      .then(() => { if (!cancelled) { setLoading(false); } }, () => undefined);
    return () => { cancelled = true; };
  }, [listService]);

  const loadForm = React.useCallback(async (taskId: number): Promise<IFormDraft> => {
    const r = await resolve();
    const [formItems, questionItems, answerItems] = await Promise.all([
      r.forms.getAllItems(), r.questions.getAllItems(), r.answers.getAllItems()
    ]);
    const form = formItems.filter(item => readLookupId(item, r.formTask, ['TaskID', 'Task']) === taskId)[0];
    if (!form) {
      return EMPTY_FORM;
    }
    const formId = numberValue(form.Id);

    const questions: IQuestionDraft[] = questionItems
      .filter(item => readLookupId(item, r.questionForm, ['FormsID', 'Forms', 'FormID', 'Form']) === formId)
      .map(item => ({ id: numberValue(item.Id), order: numberValue(readValue(item, [r.questionOrder])), item }))
      .sort(byOrderThenId)
      .map(({ id, item }) => {
        const own = answerItems
          .filter(answer => readLookupId(answer, r.answerQuestion, ['FormsQuestionID', 'FormsQuestion']) === id)
          .map(answer => ({
            id: numberValue(answer.Id),
            order: numberValue(readValue(answer, [r.answerOrder])),
            isImage: booleanValue(readValue(answer, [r.answerImageFlag])),
            isCustom: booleanValue(readValue(answer, [r.answerCustomFlag])),
            text: textValue(readValue(answer, [r.answerText]))
          }))
          .sort(byOrderThenId);
        const image = own.filter(answer => answer.isImage)[0];
        const custom = own.filter(answer => answer.isCustom && !answer.isImage)[0];
        const special = image || custom;
        const answers: IAnswerDraft[] = own
          .filter(answer => !answer.isImage && !answer.isCustom)
          .map(answer => ({ key: newKey(), id: answer.id, text: answer.text }));
        return {
          key: newKey(),
          id,
          text: textValue(readValue(item, [r.questionText])),
          answerType: image ? 'image' as const : custom ? 'custom' as const : 'choices' as const,
          specialAnswerId: special ? special.id : undefined,
          answers
        };
      });
    return { formId, questions };
  }, [resolve]);

  const saveForm = React.useCallback(async (task: IFormTask, original: IFormDraft, draft: IFormDraft): Promise<IFormDraft> => {
    const r = await resolve();

    let formId = draft.formId;
    if (formId === undefined) {
      formId = await r.forms.createItemWithId({ Title: task.title, [r.formTask]: task.id });
    }

    // removed questions go first, together with their answers
    const keptQuestionIds = draft.questions.map(q => q.id).filter((id): id is number => id !== undefined);
    for (const old of original.questions) {
      if (old.id === undefined || keptQuestionIds.indexOf(old.id) !== -1) {
        continue;
      }
      for (const id of answerIds(old)) {
        await r.answers.deleteItem(id);
      }
      await r.questions.deleteItem(old.id);
    }

    for (let index = 0; index < draft.questions.length; index++) {
      const question = draft.questions[index];
      const fields: ListItem = {
        [r.questionText]: question.text.trim(),
        [r.questionOrder]: index + 1,
        [r.questionForm]: formId
      };
      if (r.questionNeedsTitle) {
        fields.Title = question.text.trim();
      }
      let questionId = question.id;
      if (questionId === undefined) {
        questionId = await r.questions.createItemWithId(fields);
      } else {
        await r.questions.updateItem(questionId, fields);
      }

      const previous = original.questions.filter(q => q.id === question.id)[0];
      const desired: Array<{ id: number | undefined; text: string; isImage: boolean; isCustom: boolean }> =
        question.answerType === 'image'
          ? [{ id: question.specialAnswerId, text: IMAGE_ANSWER_TEXT, isImage: true, isCustom: false }]
          : question.answerType === 'custom'
            ? [{ id: question.specialAnswerId, text: CUSTOM_ANSWER_TEXT, isImage: false, isCustom: true }]
            : question.answers
              .filter(answer => answer.text.trim())
              .map(answer => ({ id: answer.id, text: answer.text.trim(), isImage: false, isCustom: false }));
      const keptAnswerIds = desired.map(a => a.id).filter((id): id is number => id !== undefined);

      for (const id of previous ? answerIds(previous) : []) {
        if (keptAnswerIds.indexOf(id) === -1) {
          await r.answers.deleteItem(id);
        }
      }
      for (let i = 0; i < desired.length; i++) {
        const answer = desired[i];
        const answerFields: ListItem = {
          [r.answerText]: answer.text,
          [r.answerOrder]: i + 1,
          [r.answerImageFlag]: answer.isImage,
          [r.answerCustomFlag]: answer.isCustom,
          [r.answerQuestion]: questionId
        };
        if (r.answerNeedsTitle) {
          answerFields.Title = answer.text;
        }
        if (answer.id === undefined) {
          await r.answers.createItem(answerFields);
        } else {
          await r.answers.updateItem(answer.id, answerFields);
        }
      }
    }

    return loadForm(task.id);
  }, [resolve, loadForm]);

  return { tasks, loading, error, loadForm, saveForm };
}

function answerIds(question: IQuestionDraft): number[] {
  const ids = question.answers.map(answer => answer.id).filter((id): id is number => id !== undefined);
  return question.specialAnswerId !== undefined ? [...ids, question.specialAnswerId] : ids;
}
