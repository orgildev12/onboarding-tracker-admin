import * as React from 'react';
import type { IProcessTask } from '../../../../models/OnboardingProcess';
import type { ListService } from '../../../../services/ListService';
import { booleanValue, dateOnly, findFieldName, findLookupField, imageUrl, numberValue, readLookupId, readValue, textValue } from '../../../../utils/listFields';
import styles from '../../../OnboardingTracker.module.scss';

export interface IProcessResultDialogProps {
  task: IProcessTask;
  createListService: (listName: string) => ListService;
  onClose: () => void;
}

interface IFormAnswer {
  question: string;
  answer: string;
  image: string;
}

interface IResultData {
  dates: string[];
  images: string[];
  isYes: boolean | undefined;
  answers: IFormAnswer[];
}

const EMPTY_RESULT: IResultData = { dates: [], images: [], isYes: undefined, answers: [] };

async function loadResult(task: IProcessTask, createListService: (listName: string) => ListService): Promise<IResultData> {
  const service = createListService(task.resultTable);
  const fields = await service.getFields();
  const taskField = findLookupField(fields, ['TaskID', 'Task'], 'TaskId');
  const employeeField = findLookupField(fields, ['NewEmployeeID', 'NewEmployee'], 'NewEmployeeId');
  const items = await service.getItems(500, `${taskField} eq ${task.taskId} and ${employeeField} eq ${task.employeeId}`);
  const imageField = findFieldName(fields, ['Image'], 'Image');
  const orderField = findFieldName(fields, ['Order'], 'Order');
  const byOrder = [...items].sort((a, b) =>
    numberValue(readValue(a, [orderField])) - numberValue(readValue(b, [orderField])) || numberValue(a.Id) - numberValue(b.Id));

  switch (task.resultKind) {
    case 'date': {
      const dateField = findFieldName(fields, ['SelectedDate'], 'SelectedDate');
      return { ...EMPTY_RESULT, dates: items.map(item => dateOnly(readValue(item, [dateField])).replace(/-/g, '.')).filter(Boolean) };
    }
    case 'multipleImages':
      return { ...EMPTY_RESULT, images: byOrder.map(item => imageUrl(readValue(item, [imageField]))).filter(Boolean) };
    case 'singleImageWithStatus': {
      const yesField = findFieldName(fields, ['IsYes'], 'IsYes');
      const item = items[0];
      return {
        ...EMPTY_RESULT,
        isYes: item ? booleanValue(readValue(item, [yesField])) : undefined,
        images: item ? [imageUrl(readValue(item, [imageField]))].filter(Boolean) : []
      };
    }
    case 'forms': {
      const questionService = createListService('FormsQuestions');
      const answerService = createListService('Answers');
      const [questionItems, answerItems] = await Promise.all([questionService.getAllItems(), answerService.getAllItems()]);
      const questions = new Map(questionItems.map(item => [numberValue(item.Id), textValue(item.Question)]));
      const answers = new Map(answerItems.map(item => [numberValue(item.Id), textValue(item.Answer)]));
      const questionField = findLookupField(fields, ['FormsQuestionID', 'FormsQuestion'], 'FormsQuestionId');
      const answerField = findLookupField(fields, ['AnswerID', 'Answer'], 'AnswerId');
      const customField = findFieldName(fields, ['CustomAnswer'], 'CustomAnswer');
      return {
        ...EMPTY_RESULT,
        answers: items.map(item => {
          const questionId = readLookupId(item, questionField, ['FormsQuestionID', 'FormsQuestion']);
          const answerId = readLookupId(item, answerField, ['AnswerID', 'Answer']);
          const customAnswer = textValue(readValue(item, [customField]));
          return {
            question: questionId ? questions.get(questionId) || '' : '',
            answer: customAnswer || (answerId ? answers.get(answerId) || '' : ''),
            image: imageUrl(readValue(item, [imageField]))
          };
        })
      };
    }
    default:
      return EMPTY_RESULT;
  }
}

export default function ProcessResultDialog({ task, createListService, onClose }: IProcessResultDialogProps): React.ReactElement {
  const [result, setResult] = React.useState<IResultData | undefined>();
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    loadResult(task, createListService)
      .then(data => { if (!cancelled) { setResult(data); } })
      .catch((e: Error) => { if (!cancelled) { setError(e.message); } });
    return () => { cancelled = true; };
  }, [task, createListService]);

  const isEmpty = !!result && !result.dates.length && !result.images.length && !result.answers.length && result.isYes === undefined;

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <div className={styles.dialog}>
        <h3>{task.title}</h3>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {!result && !error && <p>Ачаалж байна...</p>}
        {isEmpty && <p>Үр дүн олдсонгүй.</p>}
        {result && result.isYes !== undefined && <p><strong>{result.isYes ? 'Тийм' : 'Үгүй'}</strong></p>}
        {result && result.dates.map(date => <p key={date}>{date}</p>)}
        {result && result.answers.map((answer, index) => (
          <div key={index} className="tw-mb-2">
            <div className="tw-text-xs tw-text-gray-500">{answer.question}</div>
            <div className="tw-whitespace-pre-wrap">{answer.answer}</div>
            {answer.image && <img src={answer.image} alt="" className="tw-mt-1 tw-max-w-full tw-max-h-64" />}
          </div>
        ))}
        {result && result.images.map(url => <img key={url} src={url} alt="" className="tw-mb-2 tw-max-w-full tw-max-h-64" />)}
        <div className={styles.dialogActions}>
          <button type="button" onClick={onClose}>Хаах</button>
        </div>
      </div>
    </div>
  );
}
