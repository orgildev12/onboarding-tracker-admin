import * as React from 'react';
import { ChoiceGroup } from '@fluentui/react/lib/ChoiceGroup';
import type { IChoiceGroupOption } from '@fluentui/react/lib/ChoiceGroup';
import { DefaultButton, IconButton } from '@fluentui/react/lib/Button';
import { TextField } from '@fluentui/react/lib/TextField';
import type { AnswerType, IQuestionDraft } from './FormsSetupTypes';
import { newAnswer } from './FormsSetupTypes';

const ANSWER_TYPE_OPTIONS: IChoiceGroupOption[] = [
  { key: 'choices', text: 'Текст хариултууд' },
  { key: 'image', text: 'Зураг оруулах талбар' },
  { key: 'custom', text: 'Өөрийн хариулт (текст оруулах талбар)' }
];

export interface IQuestionEditorProps {
  question: IQuestionDraft;
  index: number;
  count: number;
  disabled: boolean;
  onChange: (question: IQuestionDraft) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}

function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) {
    return items;
  }
  const next = items.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function QuestionEditor({ question, index, count, disabled, onChange, onMove, onRemove }: IQuestionEditorProps): React.ReactElement {
  const { answers } = question;

  return (
    <section className="tw-rounded tw-border tw-border-gray-300 tw-bg-white tw-p-4">
      <div className="tw-flex tw-items-start tw-gap-2">
        <span className="tw-mt-1 tw-w-6 tw-shrink-0 tw-text-sm tw-font-semibold">{index + 1}.</span>
        <TextField
          className="tw-flex-1"
          placeholder="Асуулт"
          ariaLabel={`Асуулт ${index + 1}`}
          multiline
          autoAdjustHeight
          rows={1}
          disabled={disabled}
          value={question.text}
          onChange={(_, value) => onChange({ ...question, text: value || '' })}
        />
        <IconButton iconProps={{ iconName: 'Up' }} title="Дээш" ariaLabel="Дээш" disabled={disabled || index === 0} onClick={() => onMove(-1)} />
        <IconButton iconProps={{ iconName: 'Down' }} title="Доош" ariaLabel="Доош" disabled={disabled || index === count - 1} onClick={() => onMove(1)} />
        <IconButton iconProps={{ iconName: 'Delete' }} title="Асуулт устгах" ariaLabel="Асуулт устгах" disabled={disabled} onClick={onRemove} />
      </div>

      <div className="tw-ml-8 tw-mt-3">
        <ChoiceGroup
          label="Хариултын төрөл"
          disabled={disabled}
          selectedKey={question.answerType}
          options={ANSWER_TYPE_OPTIONS}
          onChange={(_, option) => option && onChange({ ...question, answerType: option.key as AnswerType })}
        />

        {question.answerType === 'choices' && (
          <div className="tw-mt-2 tw-flex tw-flex-col tw-gap-2">
            {answers.map((answer, answerIndex) => (
              <div key={answer.key} className="tw-flex tw-items-center tw-gap-2">
                <span className="tw-w-5 tw-text-xs tw-text-gray-500">{answerIndex + 1}</span>
                <TextField
                  className="tw-flex-1"
                  placeholder="Хариулт"
                  ariaLabel={`Хариулт ${answerIndex + 1}`}
                  disabled={disabled}
                  value={answer.text}
                  onChange={(_, value) => onChange({
                    ...question,
                    answers: answers.map(a => a.key === answer.key ? { ...a, text: value || '' } : a)
                  })}
                />
                <IconButton
                  iconProps={{ iconName: 'Up' }}
                  title="Дээш"
                  ariaLabel="Хариулт дээш"
                  disabled={disabled || answerIndex === 0}
                  onClick={() => onChange({ ...question, answers: moveItem(answers, answerIndex, -1) })}
                />
                <IconButton
                  iconProps={{ iconName: 'Down' }}
                  title="Доош"
                  ariaLabel="Хариулт доош"
                  disabled={disabled || answerIndex === answers.length - 1}
                  onClick={() => onChange({ ...question, answers: moveItem(answers, answerIndex, 1) })}
                />
                <IconButton
                  iconProps={{ iconName: 'Cancel' }}
                  title="Хариулт хасах"
                  ariaLabel="Хариулт хасах"
                  disabled={disabled}
                  onClick={() => onChange({ ...question, answers: answers.filter(a => a.key !== answer.key) })}
                />
              </div>
            ))}
            <div>
              <DefaultButton
                iconProps={{ iconName: 'Add' }}
                text="Хариулт нэмэх"
                disabled={disabled}
                onClick={() => onChange({ ...question, answers: [...answers, newAnswer()] })}
              />
            </div>
          </div>
        )}

        {question.answerType === 'image' && (
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-gray-600">Хариуцагч энэ асуултад нэг зураг оруулна.</p>
        )}
        {question.answerType === 'custom' && (
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-gray-600">Хариуцагч энэ асуултад өөрийн хариултыг бичнэ.</p>
        )}
      </div>
    </section>
  );
}
